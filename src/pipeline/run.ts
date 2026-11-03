import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";
import { INTAKE_DIR } from "../collections/IntakeBatches";
import { extract } from "./llm";
import { UsageLimitError } from "./claude-cli";
import { mergeDualRead } from "./dualread";
import { checkGrounding, csvToRecords, pdfToText } from "./text";
import { fetchPage } from "./sources";
import { checkSources } from "./sources";
import { checkConsistency } from "./consistency";
import { runRules } from "./rules";
import { suggestSourceType, suggestVerification } from "./labels";
import { TARGET_SPECS } from "./targets";
import type { CheckName, Finding, IntakeInput, ProposedRecord, SourceType, Target } from "./types";
import { worst } from "./types";

/** Context flag so the Candidates hook knows a write came from the pipeline, not a human edit. */
export const PIPELINE_CTX = { pipeline: true } as const;

const EMBARGO_DAYS = Number(process.env.LOCATION_EMBARGO_DAYS ?? 180);

type Batch = {
  id: string | number;
  title: string;
  text?: string;
  urls?: { url: string }[];
  files?: { url?: string; filename?: string; mimeType?: string }[];
  defaultSourceType?: SourceType;
  hintTarget?: Target;
};

// ─── COLLECT ────────────────────────────────────────────────────────────────

/** Intake files are private evidence: read from local storage, or from cloud storage by absolute URL. */
async function readIntakeFile(f: { url?: string; filename?: string }): Promise<Buffer> {
  if (f.filename) {
    try {
      return await readFile(path.join(INTAKE_DIR, path.basename(f.filename)));
    } catch {
      /* not on local disk: fall through to cloud storage */
    }
  }
  if (f.url && /^https?:\/\//.test(f.url)) {
    const res = await fetch(f.url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Could not download ${f.filename}: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`Intake file ${f.filename ?? "(unnamed)"} not found in storage`);
}

async function buildInput(batch: Batch, offline: boolean): Promise<{ input: IntakeInput; log: string[] }> {
  const log: string[] = [];
  const parts: string[] = [];
  const images: IntakeInput["images"] = [];
  let offlineRecords: ProposedRecord[] | undefined;

  if (batch.text?.trim()) parts.push(`### Pasted by editor\n${batch.text.trim()}`);

  for (const { url } of batch.urls ?? []) {
    const page = await fetchPage(url);
    if (page.ok) {
      parts.push(`### Source URL: ${url}\nTitle: ${page.title ?? ""}\nPublished: ${page.published ?? "unknown"}\n\n${page.text}`);
      log.push(`read ${url}`);
    } else {
      parts.push(`### Source URL: ${url}\n[Page could not be read automatically: ${page.error ?? page.status}]`);
      log.push(
        page.social
          ? `could not read social post ${url}: paste the post text or add a screenshot`
          : `could not read ${url}: ${page.error ?? page.status}`,
      );
    }
  }

  for (const f of batch.files ?? []) {
    if (!f.url && !f.filename) continue;
    const buf = await readIntakeFile(f);
    const type = f.mimeType ?? "";
    if (type.startsWith("image/")) {
      images.push({ mediaType: type, base64: buf.toString("base64"), label: f.filename ?? "image" });
      log.push(`image ${f.filename}`);
    } else if (type.includes("pdf")) {
      parts.push(`### File: ${f.filename}\n${await pdfToText(buf)}`);
    } else if (type.includes("csv") || f.filename?.endsWith(".csv")) {
      const csv = buf.toString("utf8");
      if (offline) {
        if (!batch.hintTarget) throw new Error("Offline CSV needs 'Hint target' set on the batch");
        offlineRecords = [...(offlineRecords ?? []), ...csvToRecords(csv, batch.hintTarget, batch.defaultSourceType)];
      } else parts.push(`### File (CSV): ${f.filename}\n${csv}`);
    } else {
      parts.push(`### File: ${f.filename}\n${buf.toString("utf8")}`);
    }
  }

  return {
    input: {
      batchId: batch.id,
      text: parts.join("\n\n---\n\n"),
      images,
      urls: (batch.urls ?? []).map((u) => u.url),
      defaultSourceType: batch.defaultSourceType,
      hintTarget: batch.hintTarget,
      offlineRecords,
    },
    log,
  };
}

// ─── UNDERSTAND ─────────────────────────────────────────────────────────────

export async function processBatch(payload: Payload, batchId: string | number, opts: { online: boolean }) {
  const batch = (await payload.findByID({ collection: "intake-batches", id: batchId, depth: 1 })) as unknown as Batch;
  await payload.update({ collection: "intake-batches", id: batchId, data: { status: "processing" } });

  try {
    const { input, log } = await buildInput(batch, !opts.online);
    let merged: { record: ProposedRecord; findings: Finding[] }[];

    if (!opts.online) {
      if (!input.offlineRecords?.length) throw new Error("Offline mode found no CSV rows in this batch");
      merged = input.offlineRecords.map((record) => ({ record, findings: [] }));
    } else {
      if (!input.text.trim() && !input.images.length) throw new Error("Nothing readable in this batch. Paste the text or add a screenshot");
      // Sequential, not parallel: gentler on plan limits and stops cleanly if one is hit
      const a = await extract(input, "A");
      const b = await extract(input, "B");
      merged = mergeDualRead(a, b);
      log.push(`read A: ${a.length} records, read B: ${b.length} records`);
    }

    const created: (string | number)[] = [];
    for (const { record, findings: dual } of merged) {
      const grounding = opts.online ? checkGrounding(record, input.text, input.images.length > 0) : [];
      const cand = await payload.create({
        collection: "candidates",
        context: PIPELINE_CTX,
        data: {
          batch: Number(batch.id),
          bundleKey: String(batch.id),
          localKey: record.localKey,
          target: record.target,
          title: record.summary.slice(0, 140),
          proposed: record as unknown as Record<string, unknown>,
          status: "checking",
          round: 0,
        },
      });
      await saveRun(payload, cand.id, 1, "grounding", grounding, opts.online ? undefined : "skipped (offline)");
      await saveRun(payload, cand.id, 1, "dual_read", dual, opts.online ? undefined : "skipped (offline)");
      await checkCandidate(payload, cand.id, 1, opts, [...grounding, ...dual]);
      created.push(cand.id);
    }

    await payload.update({
      collection: "intake-batches",
      id: batchId,
      data: { status: "done", log: [...log, `${created.length} candidates created`].join("\n") },
    });
    return created;
  } catch (e) {
    if (e instanceof UsageLimitError) {
      // Plan limit reached: put the batch back in the queue (and drop half-made candidates) so the next run redoes it cleanly
      await payload.delete({ collection: "candidates", where: { batch: { equals: batchId } }, context: PIPELINE_CTX });
      await payload.update({ collection: "intake-batches", id: batchId, data: { status: "queued", log: `Paused: ${e.message}` } });
    } else {
      await payload.update({ collection: "intake-batches", id: batchId, data: { status: "failed", log: (e as Error).message } });
    }
    throw e;
  }
}

// ─── VERIFY ─────────────────────────────────────────────────────────────────

async function saveRun(payload: Payload, candidate: string | number, round: number, check: CheckName, findings: Finding[], note?: string) {
  await payload.create({
    collection: "check-runs",
    data: {
      candidate: Number(candidate),
      round,
      check,
      result: note ? "skipped" : worst(findings),
      findings: findings as unknown as Record<string, unknown>[],
      note,
      ranAt: new Date().toISOString(),
    },
  });
}

/**
 * Runs checks 3–5 (and carries round-1 findings from checks 1–2). Used for round 1,
 * round 2 (after edits) and, via preparePromotion, round 3.
 */
export async function checkCandidate(
  payload: Payload,
  candidateId: string | number,
  round: number,
  opts: { online: boolean },
  carried: Finding[] = [],
  check: CheckName | "all" = "all",
) {
  const c = (await payload.findByID({ collection: "candidates", id: candidateId, depth: 0 })) as unknown as {
    proposed: ProposedRecord;
    lawyerApproved?: boolean;
  };
  const r = c.proposed;

  const rules = runRules(r, { now: new Date(), embargoDays: EMBARGO_DAYS, lawyerApproved: !!c.lawyerApproved });
  const src = await checkSources(r, opts);
  const cons = await checkConsistency(payload, r, candidateId);

  const label = check === "pre_promote" ? "pre_promote" : null;
  if (label) {
    await saveRun(payload, candidateId, round, "pre_promote", [...rules, ...src.findings, ...cons.findings]);
  } else {
    await saveRun(payload, candidateId, round, "rules", rules);
    await saveRun(payload, candidateId, round, "sources", src.findings);
    await saveRun(payload, candidateId, round, "consistency", cons.findings);
  }

  const all = [...carried, ...rules, ...src.findings, ...cons.findings];
  const blocks = all.filter((f) => f.severity === "block").length;
  const warns = all.filter((f) => f.severity === "warn").length;

  await payload.update({
    collection: "candidates",
    id: candidateId,
    context: PIPELINE_CTX,
    data: {
      round,
      blockCount: blocks,
      warnCount: warns,
      openFindings: all,
      supportedBy: src.supportedBy,
      archivedCopies: src.archived,
      matchExistingId: cons.existingId ? String(cons.existingId) : null,
      suggestedSourceType: suggestSourceType(r.sources),
      suggestedVerification: suggestVerification(r.sources, cons.disputed),
      needsRecheck: false,
      lastCheckedAt: new Date().toISOString(),
      ...(check === "pre_promote" ? {} : { status: blocks ? "needs_attention" : "ready_for_review" }),
    },
  });
  return { blocks, warns };
}

/** Round 2: everything a human edited since the last check. */
export async function recheckEdited(payload: Payload, opts: { online: boolean }) {
  const due = await payload.find({ collection: "candidates", where: { needsRecheck: { equals: true } }, limit: 500, depth: 0 });
  for (const c of due.docs as { id: string | number; round?: number }[]) {
    await checkCandidate(payload, c.id, Math.max(2, (c.round ?? 1) + 1), opts);
  }
  return due.docs.length;
}

export const needsLegal = (t: Target) => !!TARGET_SPECS[t].legalReview;
