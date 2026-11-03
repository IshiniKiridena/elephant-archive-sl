import { TARGET_SPECS } from "./targets";
import { norm } from "./text";
import type { Finding, ProposedRecord } from "./types";

/**
 * Check 2: dual read. Two independent extractions (different prompts) are compared.
 * Anything they disagree on is shown to the editor; read A is kept as the base, and
 * records only one read found are still kept (with a warning) so nothing is silently lost.
 */

const keyOf = (r: ProposedRecord) => {
  const s = TARGET_SPECS[r.target];
  const v = (k?: string) => (k ? norm(String(r.fields[k]?.value ?? "")) : "");
  const id = (s.nameField && v(s.nameField)) || [v(s.dateField), v(s.districtField)].filter(Boolean).join("@");
  return `${r.target}|${id || norm(r.summary).slice(0, 40)}`;
};

export function mergeDualRead(a: ProposedRecord[], b: ProposedRecord[]) {
  const out: { record: ProposedRecord; findings: Finding[] }[] = [];
  const bByKey = new Map(b.map((r) => [keyOf(r), r]));
  const used = new Set<string>();

  for (const ra of a) {
    const k = keyOf(ra);
    const rb = bByKey.get(k);
    const findings: Finding[] = [];
    if (!rb) {
      findings.push({ check: "dual_read", severity: "warn", message: "Only one of two independent reads found this record" });
    } else {
      used.add(k);
      const fields = new Set([...Object.keys(ra.fields), ...Object.keys(rb.fields)]);
      for (const f of fields) {
        const va = ra.fields[f]?.value;
        const vb = rb.fields[f]?.value;
        if (va === undefined && vb !== undefined) {
          findings.push({ check: "dual_read", severity: "warn", field: f, message: `Read B found "${String(vb)}" but read A did not. Not added; check the source` });
        } else if (va !== undefined && vb === undefined) {
          findings.push({ check: "dual_read", severity: "warn", field: f, message: "Only read A found this value" });
        } else if (norm(String(va)) !== norm(String(vb))) {
          findings.push({ check: "dual_read", severity: "warn", field: f, message: `Reads disagree: A "${String(va)}" vs B "${String(vb)}"` });
        }
      }
      if (ra.mentionsPrivatePersons !== rb.mentionsPrivatePersons) ra.mentionsPrivatePersons = true; // be cautious
    }
    out.push({ record: ra, findings });
  }

  for (const rb of b) {
    if (used.has(keyOf(rb))) continue;
    out.push({
      record: { ...rb, localKey: `b_${rb.localKey}` },
      findings: [{ check: "dual_read", severity: "warn", message: "Only read B found this record" }],
    });
  }

  // Re-point links in B-only records to their new keys
  const renamed = new Map(b.map((r) => [r.localKey, `b_${r.localKey}`]));
  for (const { record } of out)
    if (record.localKey.startsWith("b_"))
      record.links = record.links.map((l) => (l.toLocalKey && renamed.has(l.toLocalKey) ? { ...l, toLocalKey: renamed.get(l.toLocalKey) } : l));

  return out;
}
