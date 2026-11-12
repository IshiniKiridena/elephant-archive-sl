# Advocacy & Engagement Layer

**Written:** 2026-11-03
**Status:** Main goal of the site (supersedes "archive first" as the framing; the archive is the evidence that the advocacy stands on).
**Related:** `design/ui-inspiration-elephantvoices.md` (structure), `design/globals.css` (tokens), `planning/phases.md`, `planning/ingest-workflow.md`

---

## 0. Purpose statement (shown on the site)

The archive takes no side between people and elephants. It exists because protecting Sri Lanka's elephants and tuskers is urgent, and because good decisions need open, honest evidence.

**Canonical English text** (component `PurposeStatement`, see `src/components/advocacy/PurposeStatement.tsx`):

> **Why this archive exists**
> Elephant Archive Sri Lanka does not take sides. It is an independent effort to raise awareness and advocate for the protection of Sri Lanka's elephants and tuskers, which we believe is an urgent need. We do this through transparency: every figure and story shows where it came from and how far it has been checked, so you can judge it for yourself. Farmers, villagers, wildlife officers and elephants are all part of this story, and we want a future where both people and elephants are safe.

**Short form** (footer, share cards, social bios):

> Not taking sides. Advocating for Sri Lanka's elephants through open, labelled evidence.

**Where it appears**

| Place | Variant | Notes |
|---|---|---|
| Footer (every page) | short | Next to the legal line from rule 3 |
| About page | full, as the first section | |
| Home | full, in the band before "Take part" | |
| Deaths, Court Cases, Remembered | full, collapsed in `<details>` under the plain band | Sits beside `LegalNotice`, not instead of it |
| Contribute form | short, above the form | Sets expectations for submitters |
| Share cards (images) | short, one line at the bottom | |

**si / ta:** not written yet. Translate from the canonical English, then mark it "Needs native review" (`translationReview.si` / `.ta` = `needs_review`) until a native speaker approves (rule 6). Until then the English text is shown with a "Shown in English" chip. Keep the meaning "does not take sides" literal; avoid words that read as "neutral about elephants dying".

---

## 1. North star

**Advocacy through evidence.** People should leave caring more, understanding more and knowing one thing they can do. Every engagement feature must still carry the two labels (source type + verification status). Nothing becomes more persuasive by becoming less accurate.

### The engagement loop

```
Discover ──► Care ──► Understand ──► Act ──► Return
 hero,        meet      causes,        share,     elephant of
 stories      named     data, both     contribute, the month,
              elephants sides' voices  coexistence anniversaries,
                                       (support later) new stories
```

Each page owns one step of the loop and ends with **one** clear next step (never three competing buttons).

---

## 2. Two zones: Bright and Quiet

The site is lively where hope and curiosity live, and still where loss and legal matters live.

| | **Bright zone** | **Quiet zone** |
|---|---|---|
| Pages | Home, Registry, life stories (living elephants), History & Culture, Facts, Coexistence, Community stories, About | Deaths dashboard & records, Causes of death, Court cases, Remembered, Limits of this data |
| Header | Full-bleed photo or illustration | `.band-sensitive` (Umber), no photo |
| Motion | Allowed, within the motion budget (§5) | **None.** Not even hover transforms. Colour/border changes only |
| Illustration | Line-art elephants, herd walk, decorative sand linework | None, or a single static mark |
| Interaction | Quiz, flip cards, scroll stories, share | Filters, tooltips, table sort, expand/collapse. Interaction is fine; animation is not |
| Tone | Warm, curious, hopeful | Calm, factual, respectful |

Zone is decided by route, in one place (`src/lib/motion-zone.ts`), so no page can forget it.

> A life story of an elephant who has died switches to Quiet from the death section onward (scroll-story steps after `kind: "death"` render static).

---

## 3. Engagement features

Each row is buildable on the free stack (static pages, CSS-first, Postgres for the little state we need). "Phase" maps to `planning/phases.md`.

| # | Feature | What it is | Zone | Component | Phase |
|---|---|---|---|---|---|
| 1 | **Herd hero** | Our own line-art elephant family walking slowly across the Home hero; pause button; static under reduced motion / data saver | Bright | `ElephantWalk` | 1 |
| 2 | **Meet the elephants** | Registry cards with name, a defining trait, life-years, region, one photo with credit. Tap opens the life story | Bright | `ElephantCard` | 2 |
| 3 | **Scroll life stories** | Life story told in steps (birth → rescue → …) with the image pinned and text scrolling past. CSS scroll-driven animation, falls back to a plain stacked page | Bright → Quiet at death | `StoryScroller` | 2 |
| 4 | **Did you know? flip cards** | Fact on front, source + labels on back. Every fact is a verified Fact record | Bright | `FactCard` | 1 |
| 5 | **Facts quiz** | 5 questions from Fact records; each answer reveals the source and labels. No scores stored, no login | Bright | `FactQuiz` | 1 |
| 6 | **Share cards** | One tap makes an image (1080×1920 story, 1200×630 link preview) of a fact or an elephant, with labels, source and the short purpose line printed on it | Both (Quiet cards: no photo) | `/api/share-card/[kind]/[id]` | 1 |
| 7 | **Coexistence: what works** | Approaches communities and agencies use (each one a sourced record with labels, results reported as found, including mixed results). Farmers' voices first | Bright | `ApproachCard` | 3 |
| 8 | **Two voices** | Paired short accounts: a farmer/villager and a wildlife officer or researcher, on the same topic. Consent recorded | Bright | `TwoVoices` | 5 |
| 9 | **Remembered** | A calm list of named elephants who have died: name, years, district, one line, link to life story. No photos of remains, no counters | Quiet | `RememberedList` | 2 |
| 10 | **On this day** | History or life-story events on today's date (past, district-level only) | Bright | `OnThisDay` | 5 |
| 11 | **Elephant of the month** | Editor-picked living or historical elephant, with a new life story chapter | Bright | `Spotlight` | 2 |
| 12 | **Take part ladder** | Learn → Share → Contribute a story/correction → (later) Support a vetted organisation | Both | `TakePart` | 1 (Support in 7) |
| 13 | **District explorer** | Static district choropleth (deaths, rescues) with tap-to-filter. No points, no clusters | Quiet | `DistrictMap` | 1 |

### Engagement we will not use

- Live death counters, ticking numbers, red "alarm" styling.
- Streaks, badges, leaderboards, pledges with public names.
- Autoplay video or sound. Pop-ups. Countdown urgency.
- Guilt framing aimed at farmers or any community.
- Anything showing where a living elephant is or was recently.

---

## 4. Visual language (within the confirmed palette)

No new colours. Liveliness comes from illustration, photography and type, not from adding hues.

- **Illustration:** our own single-weight line drawings (1.5px at 1×, Sand on Canopy, Ivory for focal lines). Elephants drawn from reference we own or have permission for. A small set: adult, calf, tusker, herd, footprints, paddy-field edge, forest edge, perahera silhouette (History only).
- **Photography:** warm, natural, no graphic content. Every image through `CaptionedMedia` (credit + permission). On Bright pages, photos may bleed full width; on Quiet pages, no hero photos.
- **Type scale:** large expressive display on Bright heroes (clamp 2.5–4.5rem, tight tracking for Latin; Sinhala/Tamil at line-height 1.3 for headings so stacked marks don't clip). Body stays at the long-form measure (68ch).
- **Accent usage:** Sage for interactive states; Sand for heritage linework, quote marks, timeline ticks. Forest for primary buttons. Umber reserved for Quiet bands and the footer.
- **Texture:** a very faint paper grain on Bright hero sections only (SVG noise, < 2 KB, disabled in data saver).

---

## 5. Motion budget (Bright zone only)

| Rule | Value |
|---|---|
| Technology | CSS first (keyframes, scroll-driven animations). JS only for pause controls and IntersectionObserver |
| Herd walk speed | One crossing ≥ 40 s, linear; legs animate with 2–3 frames of SVG path swap, not bounce |
| Micro-interactions | 150–220 ms, `ease-out`; transform + opacity only |
| Scroll stories | Opacity/translate of ≤ 24px; nothing parallax |
| Max moving things per viewport | 1 |
| Anything moving > 5 s | Has a visible **Pause** button (WCAG 2.2.2) |
| Off-screen | Paused (`animation-play-state` via IntersectionObserver) |
| `prefers-reduced-motion` | All motion off, static illustration shown |
| Data saver (`Save-Data` / `prefers-reduced-data`) | Static illustration, no grain, images load on tap |
| Quiet zone | `data-zone="quiet"` on `<body>` turns off all transitions except colour/border |

---

## 6. Home page order (revised for advocacy)

1. Header (logo · `සිං | த | EN` · Contribute · Menu)
2. **Herd hero**: one-line mission + primary CTA "Meet the elephants" (Registry; Deaths dashboard as interim until Phase 2)
3. **Meet the elephants** row (scroll-snap, no auto-advance)
4. **Did you know?** three flip cards → "Take the quiz"
5. **Why it matters** band: one sourced key figure with labels and date + link to Deaths dashboard (the figure is static text, not animated)
6. **Coexistence: what works** teaser (farmer's voice first)
7. History timeline teaser
8. Latest stories (category chips)
9. **Purpose statement** (full) 
10. **Take part** ladder
11. Footer (short purpose line + legal line)

---

## 7. Measuring interest (inside the free 50,000 events/month)

Track only these custom events (Vercel Web Analytics), no personal data:

| Event | Fired when |
|---|---|
| `share_card` | A share image is generated (`kind`) |
| `quiz_complete` | Quiz finished (no score sent) |
| `story_depth` | Life story reaches 50% and 100% |
| `contribute_submit` | Contribute/correct form accepted |
| `lang_switch` | Language changed (`to`) |

Review monthly: which stories hold attention, which language is used most, whether sharing happens. Change content, not tactics.

---

## 8. Advocacy copy principles

1. **Evidence first, feeling second, action third.** Every emotional sentence sits next to a labelled fact.
2. **Hope is a fact too.** Show what is working, with the same labels as what is going wrong.
3. **People are part of the story.** Name pressures on farmers (crop loss, safety) plainly and with respect.
4. **One ask per page.**
5. **No absolutes we can't source.** "Reported", "according to", "estimated" are fine words.
6. **si / ta copy is written natively where possible**, not only translated, and always reviewed.

---

## 9. Phase deltas

| Phase | Add |
|---|---|
| 0 | `motion-zone.ts`, `PurposeStatement`, illustration set brief, share-card route skeleton |
| 1 | Herd hero, flip cards, quiz, share cards, Take part ladder, district explorer, purpose statement live |
| 2 | Meet the elephants, scroll life stories, Remembered, Elephant of the month |
| 3 | Coexistence: what works |
| 5 | Two voices, On this day |
| 7 | "Support" rung on the Take part ladder |
