import type { CollectionSlug, Payload } from "payload";
import { checkCandidate, needsLegal, PIPELINE_CTX } from "./run";
import { TARGET_SPECS, normaliseDistrict } from "./targets";
import { hasSinhalaOrTamil } from "./rules";
import type { ProposedRecord, ProposedSource, Target } from "./types";

/**
 * Round 3 + fan-out. Fully approved candidates are re-checked, then created as linked
 * DRAFTS in their collections. A human publishes each draft in the admin.
 *
 * Assumes every target collection (Phase 0 core schema) has: drafts enabled,
 * `sources` (hasMany → sources), `sourceType`, `verificationStatus`, `needsNativeReview`.
 */

type Cand = {
  id: string | number;
  bundleKey: string;
  localKey: string;
  target: Target;
  status: string;
  proposed: ProposedRecord;
  confirmedSourceType?: string;
  confirmedVerification?: string;
  matchExistingId?: string | null;
  promotedRecord?: string | null;
  archivedCopies?: Record<string, string>;
};

/** Target collections are created phase by phase; until then their slugs aren't in the generated types. */
const slug = (s: string) => s as unknown as CollectionSlug;

const ORDER: Target[] = ["source", "elephant", "elephantDeath", "lifeEvent", "rescue", "courtCase", "governmentAction", "historyItem", "communityStory", "fact", "humanDeathAggregate"];

export async function promoteApproved(payload: Payload, opts: { online: boolean }) {
  const res = await payload.find({
    collection: "candidates",
    where: { status: { in: ["reviewer_approved", "legal_approved", "promoted"] } },
    limit: 1000,
    depth: 0,
  });
  const all = res.docs as unknown as Cand[];
  const ready = all.filter((c) => c.status === "legal_approved" || (c.status === "reviewer_approved" && !needsLegal(c.target)));
  const byBundle = new Map<string, Cand[]>();
  for (const c of all) byBundle.set(c.bundleKey, [...(byBundle.get(c.bundleKey) ?? []), c]);

  const report: string[] = [];
  for (const c of ready.sort((a, b) => ORDER.indexOf(a.target) - ORDER.indexOf(b.target))) {
    const siblings = byBundle.get(c.bundleKey) ?? [];

    // Wait for linked siblings that aren't promoted yet
    const waiting = c.proposed.links.filter((l) => l.toLocalKey && !siblings.find((s) => s.localKey === l.toLocalKey && s.promotedRecord));
    if (waiting.length) {
      report.push(`#${c.id} waits for linked record(s) ${waiting.map((w) => w.toLocalKey).join(", ")} to be approved`);
      continue;
    }

    // The target collection may belong to a later phase
    if (!payload.collections[slug(TARGET_SPECS[c.target].collection)]) {
      report.push(`#${c.id} waits: the "${TARGET_SPECS[c.target].collection}" collection isn't built yet`);
      continue;
    }

    // Round 3
    const { blocks } = await checkCandidate(payload, c.id, 3, opts, [], "pre_promote");
    if (blocks) {
      await payload.update({ collection: "candidates", id: c.id, context: PIPELINE_CTX, data: { status: "needs_attention" } });
      report.push(`#${c.id} failed the pre-promote check (${blocks} blocking). Back to the editor`);
      continue;
    }

    const ref = await createDraft(payload, c, siblings);
    c.promotedRecord = ref;
    await payload.update({ collection: "candidates", id: c.id, context: PIPELINE_CTX, data: { status: "promoted", promotedRecord: ref } });
    report.push(`#${c.id} → draft ${ref}`);
  }
  return report;
}

/** "2024-03-10T08:00:00Z" → "2024-03-10"; keeps YYYY / YYYY-MM; drops anything unparseable. */
const looseDate = (d?: string) => {
  const m = d?.trim().match(/^(\d{4})(-\d{2})?(-\d{2})?/);
  return m ? m[0] : undefined;
};

async function upsertSource(payload: Payload, s: ProposedSource, archived?: Record<string, string>, confirmedType?: string) {
  if (s.url) {
    const hit = await payload.find({ collection: slug("sources"), where: { url: { equals: s.url } }, limit: 1, depth: 0, draft: true });
    if (hit.docs[0]) return hit.docs[0].id;
  }
  const doc = await payload.create({
    collection: slug("sources"),
    draft: true,
    data: {
      url: s.url,
      title: s.title ?? s.url ?? "Untitled source",
      publisher: s.publisher,
      date: looseDate(s.date),
      sourceType: confirmedType ?? s.sourceType,
      archiveUrl: s.url ? archived?.[s.url] : undefined,
      _status: "draft",
    } as never,
  });
  return doc.id;
}

async function createDraft(payload: Payload, c: Cand, siblings: Cand[]): Promise<string> {
  const spec = TARGET_SPECS[c.target];
  const r = c.proposed;

  if (c.target === "source") {
    // A "source" record's details live in its fields; its sources[] (if any) may add the type
    const f = (k: string) => (r.fields[k]?.value == null ? undefined : String(r.fields[k]!.value));
    const id = await upsertSource(
      payload,
      {
        url: f("url") ?? r.sources[0]?.url,
        title: f("title") ?? r.sources[0]?.title,
        publisher: f("publisher") ?? r.sources[0]?.publisher,
        date: f("date") ?? r.sources[0]?.date,
        sourceType: r.sources[0]?.sourceType ?? "unverified",
      },
      c.archivedCopies,
      c.confirmedSourceType,
    );
    return `sources:${id}`;
  }

  // Only fields the target knows. Districts normalised. Evidence spans are NOT copied.
  const data: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(r.fields)) {
    if (!(k in spec.fields)) continue;
    data[k] = k === spec.districtField ? normaliseDistrict(f.value) : f.value;
  }
  if (c.target === "courtCase") delete data.partyRoles; // roles stay in review notes; legal reviewer adds parties by hand

  const sourceIds = [];
  for (const s of r.sources) sourceIds.push(await upsertSource(payload, s, c.archivedCopies));

  for (const l of r.links) {
    if (l.toLocalKey) {
      const sib = siblings.find((s) => s.localKey === l.toLocalKey)?.promotedRecord;
      if (sib) data[l.field] = sib.split(":")[1];
    } else if (l.matchName) {
      const el = TARGET_SPECS.elephant;
      const hit = await payload.find({ collection: slug(el.collection), where: { [el.nameField!]: { like: l.matchName } }, limit: 1, depth: 0, draft: true });
      if (hit.docs[0]) data[l.field] = hit.docs[0].id;
    }
  }

  const labels = {
    sourceType: c.confirmedSourceType,
    verificationStatus: c.confirmedVerification,
    needsNativeReview: hasSinhalaOrTamil(r),
  };

  // Same record already exists → add sources (as a draft revision), never overwrite values
  if (c.matchExistingId) {
    const existing = (await payload.findByID({ collection: slug(spec.collection), id: c.matchExistingId, depth: 0, draft: true })) as unknown as {
      sources?: (string | number)[];
    };
    const merged = Array.from(new Set([...(existing.sources ?? []), ...sourceIds]));
    await payload.update({ collection: slug(spec.collection), id: c.matchExistingId, draft: true, data: { sources: merged } as never });
    return `${spec.collection}:${c.matchExistingId}`;
  }

  const doc = await payload.create({
    collection: slug(spec.collection),
    draft: true,
    data: { ...data, ...labels, sources: sourceIds, _status: "draft" } as never,
  });
  return `${spec.collection}:${doc.id}`;
}
