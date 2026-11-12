# UI Inspiration: ElephantVoices → Elephant Archive Sri Lanka
 
**Status:** Primary UI/visual reference (decided 2026-11-02)
**Reference site:** https://www.elephantvoices.org (studied 2026-11-02: homepage + an inner long-form page)
**Rule:** We borrow *structure and patterns only*. We do not copy their logo, photos, illustrations, wording, product names ("Ethogram") or a pixel-level layout. Everything is rebuilt with our palette, our logo and our own content.
 
---
 
## 1. What they do well (observed)
 
| # | Pattern observed | Why it works |
|---|---|---|
| 1 | **Header:** logo left; a persistent primary button (Donate) plus a "Menu" toggle on the right | Clean on mobile; one obvious action |
| 2 | **Mega-menu:** six topic sections, each with a **one-line description** under the title; a short secondary list below (Resources, News, About, Contact) | Visitors understand each section before clicking |
| 3 | **Flagship hero:** the homepage leads with their searchable library, not with the organisation | Puts the most useful thing first |
| 4 | **Captioned media strip:** each image caption names the individual elephant, what is happening and the place | Treats elephants as individuals |
| 5 | **Alternating topic bands:** large photo + heading + 2–3 sentence intro + "Find out more" | Easy scanning, consistent rhythm |
| 6 | **"Our story" timeline teaser** with a 3-photo collage | History presented as a journey |
| 7 | **Quote band** with a simple ink-line drawing | Calm pause between dense sections |
| 8 | **Place cards** (one card per field site, photo + one-line summary) | Geography without maps |
| 9 | **News cards with category labels** ("Stories from the Field", "In the Media") | Separates their own stories from press coverage |
| 10 | **Repeated flagship CTA** just before the footer | Second chance after scrolling |
| 11 | **Inner pages:** full-bleed hero image + H1, breadcrumbs, Share button, short intro, **in-page table of contents**, long sections collapsed behind "Read more", figures with captions, references with DOIs | Long research content stays readable |
| 12 | **Transparency section:** an explicit "Biases in the data" section | Builds trust; matches our labelling rules |
| 13 | **Controlled vocabulary:** defined terms with consistent naming, used in filter search | Makes the database searchable and consistent |
| 14 | **Descriptive alt text on every image;** images served from a CDN with width parameters | Accessibility and responsive images |
| 15 | **Footer:** menu, social links, general links, and a one-line legal/registration statement | Complete but quiet |
 
## 2. Adaptation map (theirs → ours)
 
| Theirs | Ours | Notes / rule |
|---|---|---|
| Ethogram as flagship hero | **Elephant Registry** (tuskers and individual life stories) *or* **Deaths Record** as flagship | Pick one flagship. Recommendation: Registry on the homepage hero; Deaths Record as the second band |
| 6 topic sections in mega-menu | **Elephants** (registry, life stories) · **Deaths & Causes** · **Rescues & Care** · **Court Cases** · **Government Actions** · **History & Culture** · **Community Stories** | Each with a one-line description in si / ta / en (flag si/ta for review) |
| Secondary links | **Data & Sources** · **Methodology & Labels** · **Contribute / Correct** · **About** · **Contact** | "Methodology & Labels" explains our source-type and verification labels |
| Persistent Donate button | v1: **"Contribute"** button (submit a story or correction). Later: **"Support"** → vetted organisations directory | Donations feature is later; keep the slot in the header |
| Captioned media strip | Captioned photo strip: elephant name · event · **district/region** · year · credit · permission status · labels | Rule 4: never exact or recent locations. Rule 7: credit + permission on every image |
| Topic bands with "Find out more" | Same pattern, one band per section | Static images only; no parallax |
| "Our story" timeline | **History timeline** (kingdom era → present) and **Government actions timeline** | Each timeline item carries its two labels |
| Quote band + ink drawing | Short quote band (under 15 words, attributed) **or** our own one-line text; our own line illustration of an Asian elephant | Commission or draw our own illustration |
| Field-site cards | **Region cards** (e.g. by district or protected-area region) | Past events only; never imply where elephants are now |
| News cards with category | Cards labelled **Archive story** / **In the news** / **Official notice** / **Community story** | Category = source type, shown as a chip |
| "Biases in the data" | **"Limits of this data"** section on every data page | Gaps, unconfirmed causes, conflicting figures with dates |
| Controlled vocabulary + filter search | **Cause-of-death taxonomy** + filters: cause · district · year · sex · tusker/non-tusker · age class · verification status | Taxonomy lives in Postgres as a lookup table, not hard-coded |
| Inner page TOC + Read more | Same, using native `<details>` for "Read more" | Zero JS; works on slow connections |
| References with DOIs | **Sources panel** on every record: source type chip, verification chip, date, link | Rule 2 |
| Footer statement | Footer notice: archive is for knowledge, not accusation or legal advice | Rule 3 |
 
## 3. Where we deliberately differ
 
- **Language switcher in the header** (they have none): `සිං | த | EN`, persists via route prefix (`/si`, `/ta`, `/en`).
- **No autoplay carousels.** Their media strip rotates; ours is a horizontal scroll-snap row with no auto-advance.
- **Data saver mode:** when `Save-Data` header or `prefers-reduced-data` is set, hero images are replaced by a solid token background and media loads only on tap.
- **Dark-first** (they are light, photo-led). Our photos sit on Midnight Canopy rather than white.
- **Sensitive pages** (Deaths, Court Cases): no hero photograph, no carousel, no animation, no images of remains. A plain header band, the TOC, then content. Muted accent only.
- **Animated elephants** (if used) appear only on Home, History and Facts pages, and are disabled under `prefers-reduced-motion`.
- **Sinhala/Tamil typography:** larger line-height (1.7–1.8) and slightly larger base size than English; test the mega-menu descriptions for overflow in all three languages.
## 4. Page templates to build
 
1. **Home** — header · flagship hero (Registry) · captioned photo row · topic bands (Deaths, Rescues, History, Community) · history timeline teaser · quote band · region cards · latest stories (category chips) · Contribute band · repeated flagship CTA · footer.
2. **Section landing** (e.g. Rescues) — hero band · intro · filter bar · card grid · "Limits of this data".
3. **Record / long-form page** (life story, case, action) — hero (or plain band if sensitive) · breadcrumbs · Share · intro · TOC · sections with `<details>` · figures with credit/permission · Sources panel · related records.
4. **Data page** (Deaths dashboard) — plain band · key figures with labels and dates · charts · filters · table · "Limits of this data". No animation.
5. **Court case page** — plain band · legal notice at top · status chip (e.g. *Charged*, *Pending*, *Convicted*) · timeline · sources. "Alleged" wording enforced by content review.
## 5. Brand palette (final, confirmed 2026-11-02)
 
| Token | Name | Hex | Role |
|---|---|---|---|
| `canopy` | Midnight Canopy | `#111B1A` | Main dark website background |
| `umber` | Elephant Umber | `#211A16` | Signature elephant colour; deep, almost-black brown |
| `surface` | Elevated Surface | `#1B2926` | Cards, panels and content sections |
| `forest` | Forest Green | `#24463A` | Primary brand colour |
| `sage` | Sage Green | `#7FA18A` | Accents, highlights and interactive states |
| `slate` | Slate Blue | `#344B50` | Secondary supporting colour |
| `sand` | Archive Sand | `#D8C8A5` | Heritage details, borders and logo accents |
| `ivory` | Warm Ivory | `#F1F0E7` | Main text and light logo elements |
| `muted` | Muted Text | `#B8C5BD` | Secondary text and metadata |
 
### Contrast check (WCAG 2.x, computed)
 
Text on background, ratio (AA body text needs 4.5, large text and UI parts need 3.0):
 
| Text ↓ / Background → | Canopy | Surface | Umber | Forest | Slate |
|---|---|---|---|---|---|
| Ivory | 15.36 | 13.19 | 15.00 | 9.12 | 8.09 |
| Muted | 9.84 | 8.45 | 9.61 | 5.84 | 5.18 |
| Sand | 10.64 | 9.14 | 10.40 | 6.32 | 5.61 |
| Sage | 6.16 | 5.29 | 6.02 | **3.66** | **3.25** |
 
Non-text edges: Surface vs Canopy **1.16**, Forest vs Canopy **1.68**, Slate vs Canopy **1.90**.
 
### Usage rules that follow from the check
 
1. **Sage on Forest or Slate:** large text, icons or chip outlines only, never body text (3.66 / 3.25).
2. **Cards (Surface on Canopy)** are almost invisible by colour alone (1.16). Give every card a 1px border: `sand/20` by default, `sage` on hover/focus.
3. **Forest buttons on Canopy** need a visible edge (1.68): Ivory label plus a `sage` 1px border, or use Sage as the filled button with Canopy text (6.16).
4. **Focus ring:** 2px `sage` with 2px offset (6.16 on Canopy).
5. **Umber** is a brand colour, not a surface: use it for the logo field, the footer and the plain header band on sensitive pages (Deaths, Court Cases), where it reads calmer than green.
6. **Verification chips** must not rely on colour alone: always show the word (Verified, Disputed…).
### Code
 
Tokens live in `src/styles/globals.css` as a Tailwind v4 `@theme` block (create-t3-app's current default), so utilities like `bg-canopy`, `text-muted`, `border-sand/20` exist and components never use raw hex. See `src/styles/globals.css` in the repo.
 
Logos: the four variants and where each is used are recorded in `design/logos.md`. `SiteHeader` uses the two-line lockup on mobile and the horizontal logo from `md` up; the badge never goes in the header.
 
Rhythm tokens: card radius 12px, gutter 16px, long-form measure 68ch, line-height 1.6 (Latin) and 1.75 (Sinhala/Tamil).
 
## 6. Components to build first
 
- `SiteHeader` (logo · language switcher · Contribute button · Menu)
- `MegaMenu` (topic title + one-line description, trilingual)
- `TopicBand` (image left/right alternating, heading, intro, link)
- `CaptionedMedia` (image + caption + credit + permission + label chips)
- `LabelChips` (source type + verification status)
- `RegionCard`
- `StoryCard` (category chip, title, summary, date)
- `PageToc` + `ReadMore` (native `<details>`)
- `SourcesPanel`
- `DataLimits`
- `LegalNotice` (court and death pages)
## 7. Not to copy
 
Their logo, wordmark, photographs, ink drawings, headings, body text, the "Ethogram" name, and their exact section order. Credit ElephantVoices only if we ever quote or link their research, not for design.