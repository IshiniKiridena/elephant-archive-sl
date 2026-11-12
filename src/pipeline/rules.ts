import { TARGET_SPECS, normaliseDistrict } from "./targets";
import type { Finding, ProposedRecord } from "./types";

/**
 * Check 5: deterministic lint for the project rules. Pure function, no I/O, so it is
 * cheap to run on every round and easy to unit test.
 */

export interface RuleContext {
  now: Date;
  embargoDays: number; // living-elephant events newer than this are blocked
  lawyerApproved: boolean; // set by the legal reviewer on court-case candidates
}

const SINHALA = /[඀-෿]/;
const TAMIL = /[஀-௿]/;

const COORDINATES = [
  /-?\d{1,2}\.\d{3,}\s*[,;]\s*-?\d{2,3}\.\d{3,}/, // 7.9403, 81.0188
  /\d{1,2}\s*°\s*\d{1,2}\s*['′]/, // 7° 56′
  /\b\d{1,2}\.\d+\s*°?\s*[NS]\b.*\b\d{2,3}\.\d+\s*°?\s*[EW]\b/i,
  /\b(gps|lat(itude)?|long(itude)?|plus code|maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps)\b/i,
];

const LIVE_LOCATION = /\b(last seen|currently (at|in|near|roaming)|spotted (near|at) (the )?\w+ (road|junction|tank|wewa|village)|can be seen (at|near)|where to see)\b/i;

const PRE_CONVICTION_BANNED = /\b(guilty|murderers?|killers?|criminals?|culprits?|killed by|butchers?)\b/i;
const PRE_CONVICTION_CAREFUL = /\b(poachers?|smugglers?|perpetrators?)\b/i;

const SENSATIONAL = /\b(blood(y|ied)?|gore|gory|mutilat\w*|decapitat\w*|rotting|brutal(ly)?|horrific|massacre|savage(ly)?|slaughter\w*|rampag\w*|rogue)\b/i;

const QUOTED = /["“]([^"”]{1,2000})["”]/g;

const textValues = (r: ProposedRecord): [string, string][] => [
  ["summary", r.summary],
  ...Object.entries(r.fields)
    .filter(([, f]) => typeof f.value === "string")
    .map(([k, f]) => [k, f.value as string] as [string, string]),
];

const parseLooseDate = (v: unknown): Date | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!m) return null;
  // Use the END of the period so a "2026" event is treated as possibly recent.
  const y = Number(m[1]);
  if (m[3]) return new Date(Date.UTC(y, Number(m[2]) - 1, Number(m[3])));
  if (m[2]) return new Date(Date.UTC(y, Number(m[2]), 0));
  return new Date(Date.UTC(y, 11, 31));
};

export function runRules(r: ProposedRecord, ctx: RuleContext): Finding[] {
  const spec = TARGET_SPECS[r.target];
  const out: Finding[] = [];
  const add = (severity: Finding["severity"], message: string, field?: string) =>
    out.push({ check: "rules", severity, message, field });
  const val = (k: string) => r.fields[k]?.value;

  // Required fields
  for (const k of spec.required) {
    const v = val(k);
    if (v === undefined || v === null || v === "") add("block", `Required field "${k}" is empty`, k);
  }

  // Unknown fields (guards against the model inventing columns)
  for (const k of Object.keys(r.fields)) {
    if (!(k in spec.fields)) add("warn", `Field "${k}" is not part of ${r.target}; it will be dropped`, k);
  }

  // Labels (rule 2): at least one source, each with a source type
  if (r.target !== "source") {
    if (r.sources.length === 0) add("block", "No source attached. Every record needs at least one source");
    r.sources.forEach((s, i) => {
      if (!s.sourceType) add("block", `Source ${i + 1} has no source type`, `sources.${i}`);
      if (!s.url && !(s.title && s.publisher))
        add("block", `Source ${i + 1} needs a URL, or a title and publisher for offline sources`, `sources.${i}`);
    });
    if (r.sources.length > 0 && r.sources.every((s) => s.sourceType === "social_media" || s.sourceType === "unverified"))
      add("warn", "Only social-media/unverified sources. Will be labelled Unverified until corroborated");
  }

  // Location (rule 4)
  if (spec.districtField) {
    const d = val(spec.districtField);
    if (d !== undefined && d !== null && d !== "" && !normaliseDistrict(d))
      add("block", `"${String(d)}" is not a Sri Lankan district. Use district level only`, spec.districtField);
  }
  for (const [k, t] of textValues(r)) {
    if (COORDINATES.some((re) => re.test(t))) add("block", "Coordinates or map link found. Remove it", k);
    if (LIVE_LOCATION.test(t)) add("block", "Live or last-seen location wording found. Remove it", k);
  }
  if (spec.aboutLivingElephant?.(Object.fromEntries(Object.entries(r.fields).map(([k, f]) => [k, f.value])))) {
    const when = spec.dateField ? parseLooseDate(val(spec.dateField)) : null;
    if (when) {
      const ageDays = (ctx.now.getTime() - when.getTime()) / 86_400_000;
      if (ageDays < ctx.embargoDays)
        add("block", `Event about a living elephant is only ${Math.max(0, Math.floor(ageDays))} days old (embargo ${ctx.embargoDays} days). Hold it until later`, spec.dateField);
    }
  }

  // Court cases (rule 3)
  if (r.target === "courtCase") {
    const convicted = val("caseStatus") === "convicted";
    if (!convicted) {
      for (const [k, t] of textValues(r)) {
        if (PRE_CONVICTION_BANNED.test(t)) add("block", `Pre-conviction wording "${t.match(PRE_CONVICTION_BANNED)?.[0]}". Use "alleged", "accused" or "charged"`, k);
        else if (PRE_CONVICTION_CAREFUL.test(t)) add("warn", `"${t.match(PRE_CONVICTION_CAREFUL)?.[0]}" implies guilt; prefer "suspects" or "the accused"`, k);
      }
      if (!/\b(alleged(ly)?|accused|charged|suspect(s|ed)?|reported(ly)?)\b/i.test(r.summary + " " + String(val("summary") ?? "")))
        add("warn", 'Summary does not use "alleged"/"accused"/"charged" wording');
    }
    if (r.mentionsPrivatePersons && !convicted && !ctx.lawyerApproved)
      add("block", "Source names private individuals in a case without a conviction. Names stay out until the lawyer approves");
    const roles = String(val("partyRoles") ?? "");
    if (/\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(roles)) add("warn", "partyRoles looks like it contains a name. Use roles only", "partyRoles");
  }

  // Community stories need consent
  if (r.target === "communityStory" && val("consentRecorded") !== true && val("consentRecorded") !== "true")
    add("block", "No recorded consent from the storyteller", "consentRecorded");

  // Copyright (rule 7): quotes under 15 words
  for (const [k, t] of textValues(r)) {
    for (const m of t.matchAll(QUOTED)) {
      const words = m[1].trim().split(/\s+/).length;
      if (words >= 15) add("block", `Quote of ${words} words. Keep quotes under 15 words or paraphrase`, k);
    }
  }

  // Tone (rule 5)
  for (const [k, t] of textValues(r)) {
    const m = t.match(SENSATIONAL);
    if (m) add("warn", `Sensational or graphic word "${m[0]}". Rewrite calmly`, k);
  }

  // si / ta review (rule 6)
  if (textValues(r).some(([, t]) => SINHALA.test(t) || TAMIL.test(t)))
    add("warn", "Contains Sinhala/Tamil text. Will be marked Needs native review (translationReview) on promotion");

  return out;
}

export const hasSinhalaOrTamil = (r: ProposedRecord) =>
  textValues(r).some(([, t]) => SINHALA.test(t) || TAMIL.test(t));
export const hasSinhala = (r: ProposedRecord) => textValues(r).some(([, t]) => SINHALA.test(t));
export const hasTamil = (r: ProposedRecord) => textValues(r).some(([, t]) => TAMIL.test(t));
