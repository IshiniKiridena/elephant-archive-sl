# Elephant Archive Sri Lanka

A trilingual (සිංහල · தமிழ் · English), open and labelled record of Sri Lanka's elephants. Not taking sides: advocating for Sri Lanka's elephants through transparent evidence.

**Stack:** Next.js 16 · Payload CMS 3 · Postgres (Neon in production) · Tailwind v4 · Vercel Hobby.
**Docs:** `docs/design/advocacy-engagement.md`, `docs/planning/ingest-workflow.md`, plus the claude.ai Project docs (phases, tech stack, logos, UI reference). `AGENTS.md` holds the project rules for coding agents.

## Run it locally

Needs Node 22.23+ (or 24.22+), pnpm 10, and Postgres 16.

```bash
cp .env.example .env              # then set PAYLOAD_SECRET: openssl rand -hex 32
createdb elephant_archive         # or use a Neon connection string in DATABASE_URL
pnpm install
pnpm dev                          # http://localhost:3000 → redirects to /si, /ta or /en
```

Open http://localhost:3000/admin and create the first account: it becomes **admin** automatically. Add the other people (editor, reviewer, legal reviewer) from **Admin → Users**. Every record needs approval from two different people.

## Add data (fact-check pipeline)

1. Admin → **Fact-check pipeline → Intake** → new batch: paste a post or article, add links, screenshots, PDF or CSV.
2. `pnpm ingest` reads it, drafts candidates and runs the checks.
3. Review in **Candidates**: fix blocks, read warnings, confirm both labels, approve (editor), then approve (second reviewer).
4. `pnpm ingest` again re-checks and creates drafts in the right collections; a human publishes them.

Model calls use your **Claude Pro/Max plan** through Claude Code (`claude` → `/login` once; `claude auth status` should say `claude.ai`). `pnpm ingest --offline` makes no model calls (CSV templates in `templates/`). Full details: `docs/planning/ingest-workflow.md`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm ingest` | Run the pipeline (new batches, re-checks, promotions) |
| `pnpm test:checks` | Unit tests for the fact-check rules |
| `pnpm typecheck` | TypeScript check |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after changing collections |
| `pnpm build` / `pnpm start` | Production build / serve |

## Layout

```
src/
  app/(frontend)/[locale]/          public site, root layout sets <html lang>
    (bright)/                       pages with motion allowed (home, registry, history…)
    (quiet)/                        deaths, causes, court cases, remembered: no motion
  app/(frontend)/share-card/…       share images with labels + source printed on them
  app/(payload)/                    Payload admin + API
  collections/                      Payload collections (Users, Media, pipeline)
  pipeline/                         ingest + five fact checks (rules.ts is pure and unit-tested)
  components/  i18n/  styles/  access/  lib/
scripts/ingest.ts                   the one pipeline command
templates/                          CSV templates for offline ingest
```

## Status (Phase 0)

- [x] Scaffold, brand tokens, trilingual routing, Bright/Quiet zones
- [x] Users with roles, pipeline collections, approval rules (tested end to end on Postgres)
- [ ] Core collections: Sources, Media fields, Districts, shared label fields, audit log, Payload localization
- [ ] Base components: SiteHeader, MegaMenu, SourcesPanel, DataLimits, LegalNotice, PageToc, ReadMore
- [ ] Cloudinary (private intake storage), revalidation hook, nightly backup, favicons/PWA icons
- [ ] Exit check: one real article → three check rounds → two approvals → draft renders in si/ta/en
