import type { CollectionSlug, Payload, Where } from "payload";
import { TARGET_SPECS, normaliseDistrict } from "./targets";
import type { Finding, ProposedRecord } from "./types";

/**
 * Check 4: consistency with what is already in the database (published, drafts and
 * other pending candidates). Conflicting figures are never overwritten: both are kept
 * and the record is suggested as Disputed.
 */

export interface ConsistencyResult {
  findings: Finding[];
  existingId?: string | number; // promote links/updates instead of creating
  disputed: boolean;
}

const v = (r: ProposedRecord, k?: string) => (k ? r.fields[k]?.value : undefined);

export async function checkConsistency(
  payload: Payload,
  r: ProposedRecord,
  selfCandidateId?: string | number,
): Promise<ConsistencyResult> {
  const spec = TARGET_SPECS[r.target];
  const findings: Finding[] = [];
  let existingId: ConsistencyResult["existingId"];
  let disputed = false;

  // 1. Pending candidates from other batches describing the same thing
  const sameKey: Where[] = [{ target: { equals: r.target } }, { status: { not_in: ["rejected", "promoted"] } }];
  if (selfCandidateId) sameKey.push({ id: { not_equals: selfCandidateId } });
  const pending = await payload.find({ collection: "candidates", where: { and: sameKey }, limit: 200, depth: 0 });
  const myDate = String(v(r, spec.dateField) ?? "");
  const myDistrict = normaliseDistrict(v(r, spec.districtField));
  const myName = String(v(r, spec.nameField) ?? "").toLowerCase();
  for (const c of pending.docs as unknown as { id: string | number; proposed: ProposedRecord }[]) {
    const o = c.proposed;
    if (!o) continue;
    const same =
      (myName && String(v(o, spec.nameField) ?? "").toLowerCase() === myName) ||
      (myDate && myDistrict && String(v(o, spec.dateField) ?? "") === myDate && normaliseDistrict(v(o, spec.districtField)) === myDistrict);
    if (same) findings.push({ check: "consistency", severity: "warn", message: `Looks like pending candidate #${c.id}. Merge or reject one` });
  }

  // 2. Existing records in the target collection (if it exists yet)
  if (!payload.collections[spec.collection as CollectionSlug]) {
    findings.push({ check: "consistency", severity: "warn", message: `Collection "${spec.collection}" does not exist yet; record will wait until its phase` });
    return { findings, disputed };
  }

  const or: Where[] = [];
  if (spec.nameField && myName) or.push({ [spec.nameField]: { like: myName } });
  if (spec.dateField && myDate) {
    const and: Where[] = [{ [spec.dateField]: { like: myDate.slice(0, 7) } }];
    if (spec.districtField && myDistrict) and.push({ [spec.districtField]: { equals: myDistrict } });
    or.push({ and });
  }
  if (r.target === "humanDeathAggregate") {
    or.length = 0;
    or.push({ and: [{ year: { equals: v(r, "year") } }, { district: { equals: myDistrict ?? v(r, "district") } }] });
  }
  if (!or.length) return { findings, disputed };

  const found = await payload.find({
    collection: spec.collection as unknown as CollectionSlug,
    where: { or },
    draft: true,
    limit: 20,
    depth: 0,
  });

  for (const doc of found.docs as unknown as Record<string, unknown>[]) {
    if (spec.nameField && myName && String(doc[spec.nameField] ?? "").toLowerCase() === myName) {
      existingId = doc.id as string | number;
      findings.push({ check: "consistency", severity: "warn", message: `"${myName}" already exists (#${doc.id}). Promotion will link to it and add sources, not create a new one` });
      continue;
    }
    // Same event: compare the values that matter
    const diffs = Object.entries(r.fields)
      .filter(([k, f]) => k in doc && doc[k] !== null && doc[k] !== undefined && String(doc[k]).toLowerCase() !== String(f.value).toLowerCase())
      .map(([k, f]) => `${k}: existing "${String(doc[k])}" vs new "${String(f.value)}"`);
    if (diffs.length) {
      disputed = true;
      findings.push({
        check: "consistency",
        severity: "warn",
        message: `Conflicts with #${doc.id}: ${diffs.join("; ")}. Keep both with their dates and label Disputed`,
      });
    } else {
      existingId = doc.id as string | number;
      findings.push({ check: "consistency", severity: "warn", message: `Probably the same as #${doc.id}. Promotion will add this as an extra source` });
    }
  }
  return { findings, existingId, disputed };
}
