import { describe, expect, it } from "vitest";
import { hasSinhala, hasSinhalaOrTamil, hasTamil, runRules, type RuleContext } from "../rules";
import type { ExtractedField, Finding, ProposedRecord, ProposedSource, Target } from "../types";

/**
 * One passing and one triggering case per rule in rules.ts.
 * "Passing" asserts that rule's finding is absent (other rules may still fire).
 * Warn-only rules are tested for a warning and for not blocking.
 * All names and records here are fake fixtures.
 */

const ctx: RuleContext = { now: new Date("2026-11-03T00:00:00Z"), embargoDays: 180, lawyerApproved: false };
const news: ProposedSource = { url: "https://example.org/a", publisher: "Example Outlet", sourceType: "news" };
const f = (value: ExtractedField["value"]): ExtractedField => ({ value, evidence: "x" });

const record = (target: Target, fields: Record<string, ExtractedField>, over: Partial<ProposedRecord> = {}): ProposedRecord => ({
  localKey: "r1", target, summary: "Example summary", fields,
  sources: [news], links: [], mentionsPrivatePersons: false, inputLanguage: "en", ...over,
});

const death = (over: Partial<ProposedRecord> = {}, fields: Record<string, ExtractedField> = {}) =>
  record("elephantDeath", { date: f("2025-03-10"), district: f("Polonnaruwa"), cause: f("train_collision"), ...fields },
    { summary: "Adult male died after a train collision", ...over });
const lifeEvent = (date: string, fields: Record<string, ExtractedField> = {}, over: Partial<ProposedRecord> = {}) =>
  record("lifeEvent", { kind: f("treatment"), date: f(date), district: f("Ampara"), ...fields }, { summary: "Treated for a leg injury", ...over });
const court = (over: Partial<ProposedRecord> = {}, fields: Record<string, ExtractedField> = {}) =>
  record("courtCase", { caseStatus: f("charged"), ...fields }, { summary: "Two suspects were charged over the alleged shooting", ...over });
const story = (fields: Record<string, ExtractedField> = {}) =>
  record("communityStory", { summary: f("A farmer's account of crop losses"), consentRecorded: f(true), ...fields });

const run = (r: ProposedRecord, c: RuleContext = ctx) => runRules(r, c);
const matching = (r: ProposedRecord, re: RegExp, c?: RuleContext) => run(r, c).filter((x) => re.test(x.message));
const severities = (fs: Finding[]) => fs.map((x) => x.severity);

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i + 1}`).join(" ");

describe("baseline", () => {
  it("clean records produce no findings", () => {
    expect(run(death())).toEqual([]);
    expect(run(lifeEvent("2024-01-05"))).toEqual([]);
    expect(run(court())).toEqual([]);
    expect(run(story())).toEqual([]);
  });
});

describe("required fields", () => {
  const RE = /Required field "district"/;
  it("passes when filled", () => expect(matching(death(), RE)).toEqual([]));
  it.each([["empty string", ""], ["null", null]])("blocks when %s", (_, v) => {
    expect(severities(matching(death({}, { district: f(v) }), RE))).toEqual(["block"]);
  });
  it("blocks when missing", () => {
    const r = death();
    delete r.fields.district;
    expect(severities(matching(r, RE))).toEqual(["block"]);
  });
  it("accepts false and 0 as filled", () => {
    expect(matching(record("humanDeathAggregate", { year: f(2020), count: f(0) }), /Required/)).toEqual([]);
  });
});

describe("unknown fields", () => {
  const RE = /is not part of elephantDeath/;
  it("passes with only spec fields", () => expect(matching(death(), RE)).toEqual([]));
  it("warns on an invented field", () => {
    const found = matching(death({}, { villageName: f("Example village") }), RE);
    expect(severities(found)).toEqual(["warn"]);
    expect(found[0].field).toBe("villageName");
  });
});

describe("sources: at least one", () => {
  const RE = /No source attached/;
  it("passes with a source", () => expect(matching(death(), RE)).toEqual([]));
  it("blocks with none", () => expect(severities(matching(death({ sources: [] }), RE))).toEqual(["block"]));
  it("does not apply to a source record itself", () => {
    expect(run(record("source", { title: f("Example report") }, { sources: [] }))).toEqual([]);
  });
});

describe("sources: source type", () => {
  const RE = /has no source type/;
  it("passes with a type", () => expect(matching(death(), RE)).toEqual([]));
  it("blocks without one", () => {
    const untyped = { url: "https://example.org/b" } as ProposedSource;
    expect(severities(matching(death({ sources: [untyped] }), RE))).toEqual(["block"]);
  });
});

describe("sources: URL or title + publisher", () => {
  const RE = /needs a URL, or a title and publisher/;
  it("passes for an offline source with title and publisher", () => {
    const offline: ProposedSource = { title: "Example annual report", publisher: "Example Department", sourceType: "official" };
    expect(matching(death({ sources: [offline] }), RE)).toEqual([]);
  });
  it("blocks for a title with no publisher and no URL", () => {
    const partial: ProposedSource = { title: "Example annual report", sourceType: "official" };
    expect(severities(matching(death({ sources: [partial] }), RE))).toEqual(["block"]);
  });
});

describe("sources: social-media / unverified only", () => {
  const RE = /Only social-media\/unverified sources/;
  const social: ProposedSource = { url: "https://social.example/post/1", sourceType: "social_media" };
  it("passes when at least one stronger source is present", () => {
    expect(matching(death({ sources: [social, news] }), RE)).toEqual([]);
  });
  it("warns (does not block) when all are social/unverified", () => {
    const r = death({ sources: [social, { url: "https://example.org/c", sourceType: "unverified" }] });
    expect(severities(matching(r, RE))).toEqual(["warn"]);
    expect(severities(run(r))).not.toContain("block");
  });
});

describe("location: district level only", () => {
  const RE = /is not a Sri Lankan district/;
  it.each(["Polonnaruwa", "Polonnaruwa District", "  nuwara eliya  "])("passes for %j", (d) => {
    expect(matching(death({}, { district: f(d) }), RE)).toEqual([]);
  });
  it("allows 'national' on aggregates", () => {
    expect(matching(record("humanDeathAggregate", { year: f(2020), count: f(1), district: f("national") }), RE)).toEqual([]);
  });
  it("blocks a village name", () => {
    expect(severities(matching(death({}, { district: f("Example Village") }), RE))).toEqual(["block"]);
  });
});

describe("location: coordinates and map links", () => {
  const RE = /Coordinates or map link/;
  it("passes for district-level wording", () => {
    expect(matching(death({ summary: "Died near the railway line in Polonnaruwa district" }), RE)).toEqual([]);
  });
  it.each([
    "Found at 7.9403, 81.0188",
    "Found at 7° 56′ N",
    "Found at 7.94 N, 81.01 E",
    "GPS reading was taken",
    "Latitude was recorded",
    "See https://maps.app.goo.gl/example",
    "See https://www.google.com/maps/place/example",
    "Plus code given in the report",
  ])("blocks %j", (summary) => {
    expect(severities(matching(death({ summary }), RE))).toEqual(["block"]);
  });
  it("checks string field values, not only the summary", () => {
    const r = lifeEvent("2024-01-05", { description: f("Treated at 7.9403, 81.0188") });
    expect(matching(r, RE)[0]?.field).toBe("description");
  });
});

describe("location: live or last-seen wording", () => {
  const RE = /Live or last-seen location/;
  it("passes for a past event description", () => expect(matching(lifeEvent("2024-01-05"), RE)).toEqual([]));
  it.each([
    "He was last seen near the tank",
    "The herd is currently roaming near the village",
    "Spotted near the Example road",
    "Where to see him",
  ])("blocks %j", (summary) => {
    expect(severities(matching(lifeEvent("2024-01-05", {}, { summary }), RE))).toEqual(["block"]);
  });
});

describe("location: embargo on recent living-elephant events", () => {
  const RE = /embargo 180 days/;
  it("passes for an old event", () => expect(matching(lifeEvent("2024-01-05"), RE)).toEqual([]));
  it("passes at exactly the embargo age (180 days)", () => expect(matching(lifeEvent("2026-05-07"), RE)).toEqual([]));
  it("passes for a recent event that is not about a living elephant", () => {
    expect(matching(lifeEvent("2026-10-01", { kind: f("death") }), RE)).toEqual([]);
    expect(matching(record("rescue", { incidentType: f("well_or_pit"), date: f("2026-10-01"), district: f("Ampara"), outcome: f("died") }), RE)).toEqual([]);
  });
  it("blocks one day inside the embargo (179 days)", () => {
    const found = matching(lifeEvent("2026-05-08"), RE);
    expect(severities(found)).toEqual(["block"]);
    expect(found[0].field).toBe("date");
  });
  it("blocks a recent rescue where the elephant lived", () => {
    const r = record("rescue", { incidentType: f("well_or_pit"), date: f("2026-10-01"), district: f("Ampara"), outcome: f("released") });
    expect(severities(matching(r, RE))).toEqual(["block"]);
  });
  it("treats year-only and month-only dates as the end of the period", () => {
    expect(severities(matching(lifeEvent("2026"), RE))).toEqual(["block"]);
    expect(severities(matching(lifeEvent("2026-06"), RE))).toEqual(["block"]); // 30 June → 126 days
  });
  it("blocks future dates", () => expect(severities(matching(lifeEvent("2027-01-01"), RE))).toEqual(["block"]));
});

describe("court case: banned pre-conviction wording", () => {
  const RE = /Pre-conviction wording/;
  it("passes neutral wording", () => expect(matching(court(), RE)).toEqual([]));
  it("passes 'guilty' after conviction", () => {
    expect(matching(court({ summary: "Found guilty" }, { caseStatus: f("convicted") }), RE)).toEqual([]);
  });
  it("blocks 'guilty' before conviction", () => {
    expect(severities(matching(court({ summary: "The guilty men were charged" }), RE))).toEqual(["block"]);
  });
  it("checks the summary field as well as the record summary", () => {
    const found = matching(court({}, { summary: f("The culprits were charged") }), RE);
    expect(found.map((x) => x.field)).toEqual(["summary"]);
  });
  it("still blocks after acquittal", () => {
    expect(severities(matching(court({ summary: "The killers were acquitted" }, { caseStatus: f("acquitted") }), RE))).toEqual(["block"]);
  });
});

describe("court case: words that imply guilt", () => {
  const RE = /implies guilt/;
  it("passes 'suspects'", () => expect(matching(court(), RE)).toEqual([]));
  it("warns (does not block) on 'poachers'", () => {
    const r = court({ summary: "Two alleged poachers were charged" });
    expect(severities(matching(r, RE))).toEqual(["warn"]);
    expect(severities(run(r))).not.toContain("block");
  });
});

describe("court case: alleged / accused / charged wording", () => {
  const RE = /does not use "alleged"/;
  it("passes when the summary uses it", () => expect(matching(court(), RE)).toEqual([]));
  it("passes after conviction", () => {
    expect(matching(court({ summary: "A case was heard" }, { caseStatus: f("convicted") }), RE)).toEqual([]);
  });
  it("warns when missing", () => {
    expect(severities(matching(court({ summary: "A case was filed at the magistrate's court" }), RE))).toEqual(["warn"]);
  });
});

describe("court case: private names need lawyer approval", () => {
  const RE = /Names stay out until the lawyer approves/;
  it("passes with lawyer approval", () => {
    expect(matching(court({ mentionsPrivatePersons: true }), RE, { ...ctx, lawyerApproved: true })).toEqual([]);
  });
  it("passes after conviction", () => {
    expect(matching(court({ mentionsPrivatePersons: true }, { caseStatus: f("convicted") }), RE)).toEqual([]);
  });
  it("blocks without approval or conviction", () => {
    expect(severities(matching(court({ mentionsPrivatePersons: true }), RE))).toEqual(["block"]);
  });
});

describe("court case: partyRoles holds roles, not names", () => {
  const RE = /partyRoles looks like it contains a name/;
  it("passes for roles", () => expect(matching(court({}, { partyRoles: f("two suspects, a businessman") }), RE)).toEqual([]));
  it("warns on a capitalised two-word name", () => {
    expect(severities(matching(court({}, { partyRoles: f("Example Person and one other") }), RE))).toEqual(["warn"]);
  });
});

describe("community story: consent", () => {
  const RE = /No recorded consent/;
  it.each([[true], ["true"]])("passes when consentRecorded is %j", (v) => {
    expect(matching(story({ consentRecorded: f(v) }), RE)).toEqual([]);
  });
  it.each([[false], ["yes"], [null]])("blocks when consentRecorded is %j", (v) => {
    expect(severities(matching(story({ consentRecorded: f(v) }), RE))).toEqual(["block"]);
  });
  it("blocks when consentRecorded is missing", () => {
    const r = story();
    delete r.fields.consentRecorded;
    expect(severities(matching(r, RE))).toEqual(["block"]);
  });
});

describe("copyright: quotes under 15 words", () => {
  const RE = /Keep quotes under 15 words/;
  it("passes a 14-word quote", () => expect(matching(death({ summary: `"${words(14)}"` }), RE)).toEqual([]));
  it("blocks a 15-word quote", () => expect(severities(matching(death({ summary: `"${words(15)}"` }), RE))).toEqual(["block"]));
  it("blocks a 15-word curly-quoted quote", () => {
    expect(severities(matching(death({ summary: `“${words(15)}”` }), RE))).toEqual(["block"]);
  });
});

describe("tone: sensational or graphic words", () => {
  const RE = /Sensational or graphic word/;
  it("passes calm wording", () => expect(matching(death(), RE)).toEqual([]));
  it("warns (does not block) on 'horrific'", () => {
    const r = death({ summary: "A horrific death" });
    expect(severities(matching(r, RE))).toEqual(["warn"]);
    expect(severities(run(r))).not.toContain("block");
  });
});

describe("Sinhala / Tamil text needs native review", () => {
  const RE = /Contains Sinhala\/Tamil text/;
  // Script-detection fixtures only; the words' meaning is not relied on.
  it("passes English-only text", () => {
    expect(matching(death(), RE)).toEqual([]);
    expect(hasSinhalaOrTamil(death())).toBe(false);
  });
  it.each([["Sinhala", "අලියා"], ["Tamil", "யானை"]])("warns on %s script", (_, text) => {
    const r = death({ summary: text });
    expect(severities(matching(r, RE))).toEqual(["warn"]);
    expect(hasSinhalaOrTamil(r)).toBe(true);
  });
  // promote.ts uses these to set translationReview.si / .ta to "needs_review"
  it("hasSinhala / hasTamil are false for English-only text", () => {
    expect(hasSinhala(death())).toBe(false);
    expect(hasTamil(death())).toBe(false);
  });
  it("hasSinhala / hasTamil tell the two scripts apart, in fields as well as the summary", () => {
    const sinhala = death({}, { elephantName: f("අලියා") });
    const tamil = death({ summary: "யானை" });
    expect([hasSinhala(sinhala), hasTamil(sinhala)]).toEqual([true, false]);
    expect([hasSinhala(tamil), hasTamil(tamil)]).toEqual([false, true]);
  });
});

/**
 * Known gaps. Each `it.fails` states the behaviour the rule SHOULD have; it passes today
 * because the rule is wrong. When a rule is fixed its test will start failing:
 * change `it.fails` to `it` then.
 */
describe("known gaps in rules.ts", () => {
  it.fails("the word 'long' is not a coordinate (false block)", () => {
    expect(matching(death({ summary: "The elephant had been ill for a long time" }), /Coordinates/)).toEqual([]);
  });
  it.fails("'currently in' a court is not a live location (false block)", () => {
    expect(matching(court({ summary: "The case is currently in the High Court; two accused were charged" }), /Live or last-seen/)).toEqual([]);
  });
  it.fails("an unparseable date on a living-elephant event should not skip the embargo", () => {
    expect(severities(run(lifeEvent("October 2026")))).toContain("block");
  });
  it.fails("two-decimal coordinates are still precise (~1 km) and should block", () => {
    expect(severities(matching(death({ summary: "Found at 7.94, 81.01" }), /Coordinates/))).toEqual(["block"]);
  });
  it.fails("single-quoted long quotes should block", () => {
    expect(severities(matching(death({ summary: `‘${words(15)}’` }), /Keep quotes under 15 words/))).toEqual(["block"]);
  });
  it.fails("initials-style names in partyRoles should warn", () => {
    expect(severities(matching(court({}, { partyRoles: f("A.B. Example and one other") }), /looks like it contains a name/))).toEqual(["warn"]);
  });
});
