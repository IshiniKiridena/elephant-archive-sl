/**
 * pnpm ingest [--only new|recheck|promote] [--batch <id>] [--offline]
 *
 * Runs on your machine (or a manual GitHub Action), never on Vercel.
 * Does everything that is due, in order:
 *   1. new batches      → read A + read B → candidates → round-1 checks
 *   2. edited candidates → round-2 checks
 *   3. fully approved   → round-3 pre-promote check → linked DRAFTS in target collections
 * Nothing is ever published by this script.
 */
import "dotenv/config";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { processBatch, recheckEdited } from "../src/pipeline/run";
import { promoteApproved } from "../src/pipeline/promote";
import { provider } from "../src/pipeline/llm";
import { UsageLimitError } from "../src/pipeline/claude-cli";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
};

const offline = !!flag("offline") || provider() === "off";
const maxBatches = Number(flag("max") ?? process.env.PIPELINE_MAX_BATCHES ?? 10); // keep each run small on plan limits
const only = flag("only") as "new" | "recheck" | "promote" | undefined;
const batchId = flag("batch") as string | undefined;
const opts = { online: !offline };

async function main() {
  const payload = await getPayload({ config });
  if (offline) console.log("Offline mode: no model calls. Grounding + dual read skipped; editors confirm source support by hand.");
  else console.log(provider() === "subscription" ? "Using your Claude plan via Claude Code (no API billing)." : "Using the Anthropic API key (pay-as-you-go).");

  const stopForLimit = (e: unknown) => {
    if (!(e instanceof UsageLimitError)) return false;
    console.log(`\n⏸  Plan usage limit reached: ${e.message}\n   Unfinished work stays queued. Run pnpm ingest again after the limit resets.`);
    return true;
  };

  try {
    if (!only || only === "new") {
      const where: Where = batchId ? { id: { equals: batchId } } : { status: { equals: "queued" } };
      const batches = await payload.find({ collection: "intake-batches", where, limit: maxBatches, sort: "createdAt", depth: 0 });
      for (const b of batches.docs) {
        try {
          const ids = await processBatch(payload, b.id, opts);
          console.log(`✓ batch ${b.id} "${(b as { title: string }).title}": ${ids.length} candidates`);
        } catch (e) {
          if (e instanceof UsageLimitError) throw e;
          console.error(`✗ batch ${b.id}: ${(e as Error).message}`);
        }
      }
    }

    if (!only || only === "recheck") {
      const n = await recheckEdited(payload, opts);
      if (n) console.log(`✓ rechecked ${n} edited candidate(s)`);
    }

    if (!only || only === "promote") {
      const report = await promoteApproved(payload, opts);
      report.forEach((l) => console.log(`  ${l}`));
      if (report.some((l) => l.includes("→ draft"))) console.log("Drafts created. Open them in the admin to publish.");
    }
  } catch (e) {
    if (!stopForLimit(e)) throw e;
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
