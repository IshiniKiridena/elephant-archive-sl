# Ingest & Fact-Check Workflow

**Written:** 2026-11-03
**What it does:** you add raw material (pasted notes, URLs, CSV, PDF/text files). The pipeline works out which records it describes, drafts them into the right collections' review queue, and fact-checks them **three times** across five independent checks before two different humans approve. Nothing publishes itself.
**Shape:** same idea as the YouTube research workflow (collect → understand → verify → write → publish), with the "verify" step made strict and repeatable.
**Stack note:** built on Payload CMS 3 + Postgres (per `planning/tech-stack.md`, which replaced Prisma/tRPC/NextAuth on 2026-11-02).

---

## 1. Stages at a glance

```
 COLLECT            UNDERSTAND             VERIFY (×3 rounds)                 APPROVE (humans)              PUBLISH (human)
┌──────────┐   ┌──────────────────┐   ┌───────────────────────────┐   ┌──────────────────────────┐   ┌────────────────┐
│ Intake   │──►│ Read A + Read B  │──►│ 1 grounding  2 dual-read  │──►│ Editor ✓ (labels set)    │──►│ promote → draft │
│ Batch    │   │ (independent     │   │ 3 sources    4 consistency│   │ Reviewer ✓ (≠ editor)    │   │ in target coll. │
│ text/url │   │  extractions)    │   │ 5 rules                    │   │ Legal ✓ (court cases)    │   │ human publishes │
│ csv/pdf  │   └──────────────────┘   └───────────────────────────┘   └──────────────────────────┘   └────────────────┘
└──────────┘          Candidates          round 1: on extraction             any edit ⇒ back to          round 3: pre-promote
                                          round 2: after every edit          "checking", approvals       re-check (sources still
                                                                             cleared                     live, no new conflicts)
```

### The three rounds

| Round | When | Why |
|---|---|---|
| 1 | Right after extraction | Catch hallucinated fields, rule breaks, duplicates before a human spends time |
| 2 | After **every** human edit to a candidate | An edit can introduce an error; approvals are cleared and checks rerun |
| 3 | Immediately before promotion | Sources can die, a newer conflicting figure can arrive between review and promotion |

### The five checks

| # | Check | How | Blocks when |
|---|---|---|---|
| 1 | **Grounding** | Every extracted field carries an evidence span; the code confirms the span exists word-for-word in the input | A span isn't found (the model invented it) |
| 2 | **Dual read** | Two independent extractions with different prompts; fields compared | — (warns on any disagreement, human decides) |
| 3 | **Sources** | Each URL fetched: live? date? Model asked if the page supports the claim; its evidence must exist in the page text | Page contradicts the claim; no source at all |
| 4 | **Consistency** | Compared with existing records: likely duplicate? Same figure with a different value? | — (conflicts become **Disputed**, both figures kept with dates; never overwritten) |
| 5 | **Rules** | Deterministic lint for the project rules | Coordinates / sub-district places / recent location of a living elephant; private person named in a case without conviction or lawyer approval; "guilty/murderer"-type wording before conviction; quote ≥ 15 words; missing source/source type; community story without recorded consent. (Image credit/permission is enforced on the `Media` collection, not here: intake screenshots are private evidence and never published) |

Warnings don't block; they appear on the candidate for the editor. Blocks prevent approval (enforced in a Payload hook, not just the UI).

---

## 2. Adding data (your part)

### Quick add: drop in anything you find

One box in the admin (**Intake → Quick add**) takes whatever you found: a news link, a Facebook/X/Instagram post link, a pasted post, a screenshot, a PDF, a gazette, your own notes. You don't choose where it goes.

| You drop in | The pipeline does |
|---|---|
| Article / official page URL | Fetches it (as data), reads it, records it as a `Source` |
| Social post URL | Tries to fetch; social sites usually block this, so the batch asks you to **paste the post text or a screenshot** too. Source type defaults to *social media*, verification to *single source / unverified* until corroborated |
| Pasted text | Read as-is; if you paste someone else's article, only facts are extracted and public text is rewritten by editors (copyright) |
| Screenshot / photo of a document | Read with the model's vision; the image is kept private as evidence, **not** published (permission unknown) |
| PDF / CSV / TXT | Text extracted and read |

**Fan-out:** one source usually holds several records. A single article about a tusker's death might produce: a `Source`, an `elephantDeath`, a `lifeEvent` on that elephant's timeline, a `courtCase` (if someone was charged), and a `fact`. Each becomes its own candidate in the same **bundle**, checked separately, approved together or separately, and on promotion they are created as linked drafts (death ↔ elephant ↔ case ↔ source) in their collections. If the elephant or case already exists, the candidate links to it instead of creating a duplicate.

### Full batch form

In the admin, **Intake → New batch** (Quick add is the same form with only the first box shown):

| Field | Use |
|---|---|
| Title | e.g. "DWC annual figures 2024 notes" |
| Text | Paste notes, article summaries in your own words, transcripts |
| URLs | One per row: articles, official releases, gazettes |
| Files | `.txt`, `.md`, `.csv`, `.pdf` |
| Default source type | What most of this batch is (official, news …). The model may suggest per-source types; you confirm |
| Provided by / notes | Where the material came from |
| Hint target | Optional: "elephantDeath", "courtCase"… to focus extraction |

Then run locally:

```bash
pnpm ingest                  # does everything due: new batches (round 1), edited candidates (round 2),
                             # fully approved candidates → pre-promote check (round 3) → linked drafts
pnpm ingest --only new|recheck|promote
pnpm ingest --batch <id>     # one batch only
pnpm ingest --offline        # no LLM: CSV/structured input only; grounding + dual read skipped
```

So the everyday loop is: drop things in → `pnpm ingest` → review in the admin → `pnpm ingest` → publish the drafts.

Run it on your laptop (or a manual GitHub Action), **not** on Vercel: it keeps Vercel CPU-hours and Neon compute free.

### Cost: runs on your Claude plan, not pay-as-you-go

Checks 1, 4 and 5 are plain code. The two reads and the "does this source back the claim" check need the model, and by default they run through **Claude Code signed in with your Pro/Max plan** (`claude -p`), so they use your plan's included usage instead of API billing.

| `PIPELINE_LLM` | Who pays | Use when |
|---|---|---|
| `subscription` (default) | Your Claude plan's limits | Normal use |
| `off` (or `--offline`) | Nothing | CSV ingest, or you're out of plan usage |
| `api` | Anthropic API, pay-as-you-go | Only if you deliberately choose it later |

Things to know:
- **Limits are shared** with your Claude chats (same five-hour and weekly limits). A heavy ingest day leaves less for chatting, and vice versa.
- **Each source costs roughly three model calls** (read A, read B, plus one support check per link). Screenshots cost more than text.
- **If you hit the limit mid-run,** the pipeline stops cleanly, puts the unfinished batch back in the queue, and says so. Run `pnpm ingest` again after the reset; nothing is half-saved.
- **Keep runs small:** `--max 5` (or `PIPELINE_MAX_BATCHES`) processes at most that many batches per run.
- **Never set `ANTHROPIC_API_KEY`** in this shell unless you want API billing: Claude Code would use the key instead of your plan. The pipeline also strips it from the `claude` child process as a safety net.
- **Run it on your laptop.** For a scheduled GitHub Action, `claude setup-token` can create a long-lived subscription token, but keep that token secret and prefer running by hand while the archive is small.

### How the `claude -p` calls are locked down

Each call runs in an empty temporary folder with `--safe-mode` (none of your CLAUDE.md, hooks, skills, plugins or MCP servers load), our own system prompt replacing the coding one, no tools at all (or only `Read`, limited to that folder, when a screenshot must be viewed), no permission prompts, no saved session, a few turns maximum, and a JSON schema the answer must match. The material is piped in on stdin and wrapped as untrusted data. `--bare` is not used because it skips the subscription login.

---

## 3. Human gates

| Gate | Who | Must do |
|---|---|---|
| Editor | editor | Read findings, fix or reject, **set the confirmed source type and verification status** (the pipeline only *suggests*), tick "claim supported" for any source the check could not read |
| Reviewer | reviewer, not the same person as the editor | Second read against the sources; check tone (rule 5) |
| Legal | legal reviewer | Court cases only: names, wording, `lawyerApproved` per party |
| Publisher | editor or admin | Opens the promoted **draft** in its collection and publishes. si/ta fields stay flagged until native review |

"Verified" is a human decision only. The pipeline can suggest *Single source*, *Reported by multiple outlets* or *Disputed*, never *Verified*.

---

## 4. Candidate status machine

```
extracted ─► checking ─► needs_attention ─┐
                 │                         │ (edit) 
                 └─► ready_for_review ◄────┘
                          │ editor ✓
                     editor_approved
                          │ reviewer ✓ (≠ editor)
                     reviewer_approved ── court case ──► legal_approved
                          │                                   │
                          └──────────── pnpm ingest --promote ┘
                                         (round 3 passes)
                                              ▼
                                          promoted  (draft exists in target; human publishes)
any edit to proposed data or sources ⇒ checking, approvals cleared
rejected (any time, with reason)
```

---

## 5. Targets the pipeline can draft

`elephantDeath`, `elephant`, `lifeEvent`, `rescue`, `courtCase`, `governmentAction`, `historyItem`, `communityStory`, `fact`, `humanDeathAggregate`.
Each maps to a Payload collection slug in `src/pipeline/targets.ts`. If the collection doesn't exist yet (later phase), candidates still queue and wait.

---

## 6. Safety rules built into the code

- Input and fetched pages are wrapped as untrusted data; the prompts tell the model to ignore instructions inside them (rule 8). The model's output is only ever a structured tool call, validated before use.
- Evidence spans are stored **internally** for checking and are never published (copyright, rule 7). Public text is written by editors in their own words.
- No coordinates field exists anywhere; the rules check also blocks coordinate-like strings, "last seen", and named villages/roads for living elephants.
- Living-elephant events newer than `LOCATION_EMBARGO_DAYS` (default 180) are blocked.
- Court-case candidates for non-convicted cases never auto-fill party names into public fields.

---

## 7. Setup

```bash
pnpm add papaparse pdf-parse dotenv
pnpm add -D @types/papaparse tsx @anthropic-ai/sdk   # SDK only needed if you ever use PIPELINE_LLM=api
# Claude Code, signed in with your Pro/Max account (one time):
claude            # then /login with your Claude account, not a Console/API account
claude auth status   # authMethod should be "claude.ai"
```

`package.json`: `"ingest": "tsx scripts/ingest.ts"` (with the `@payload-config` path alias as in your tsconfig).

`payload.config.ts`: add `IntakeBatches`, `IntakeFiles`, `Candidates`, `CheckRuns` to `collections`. Point the storage adapter for `intake-files` at a **private** location (evidence screenshots must not be public).

`.env`:
```
PIPELINE_LLM=subscription        # subscription | off | api
PIPELINE_CLI_MODEL=sonnet        # model alias for claude -p
PIPELINE_MAX_BATCHES=10          # batches per run
LOCATION_EMBARGO_DAYS=180
ARCHIVE_ON_CHECK=0               # 1 = ask the Wayback Machine to save each source
# ANTHROPIC_API_KEY / PIPELINE_LLM_MODEL only if PIPELINE_LLM=api
```

### Files

| Path | Role |
|---|---|
| `src/collections/IntakeBatches.ts` | Intake + private evidence uploads |
| `src/collections/Candidates.ts` | Staging records + server-side approval guard |
| `src/collections/CheckRuns.ts` | Audit trail of every check, every round |
| `src/pipeline/llm.ts` | Read A / read B extraction (text + screenshots), source-support judge; picks the provider |
| `src/pipeline/claude-cli.ts` | Locked-down `claude -p` call on your plan; clean stop at usage limits |
| `src/pipeline/text.ts` | Text extraction, grounding check, CSV → records |
| `src/pipeline/dualread.ts` | Compares the two reads |
| `src/pipeline/sources.ts` | Fetch, liveness, social-post handling, support check, optional archive |
| `src/pipeline/consistency.ts` | Duplicates and conflicting figures |
| `src/pipeline/rules.ts` | Project-rule lint (pure, unit-testable) |
| `src/pipeline/labels.ts` | Label suggestions (never "Verified") |
| `src/pipeline/run.ts` | Batch processing + rounds 1–2 |
| `src/pipeline/promote.ts` | Round 3 + linked draft creation across collections |
| `scripts/ingest.ts` | The one command |

## 8. CSV templates (`templates/`)

| File | Target |
|---|---|
| `elephant-deaths.csv` | elephantDeath |
| `facts.csv` | fact |
| `government-actions.csv` | governmentAction |

Every row needs at least one `source_url` (or `source_title` + `publisher` for print/offline sources) and a `source_type`. Leave `verification` blank: editors set it.
