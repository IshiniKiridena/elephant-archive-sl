# Logos

Which logo file goes where, and the rules for using them. The files are in `public/brand/`. Untouched originals are in `design/brand-source/`.

## Files

| File | What it is | Used for |
|---|---|---|
| `logo-horizontal.svg` | Horizontal lockup: mark + "Elephant Archive / Sri Lanka" on one line | Header from `md` up; footer |
| `logo-stacked.svg` | Two-line lockup | Header below `md`; social image |
| `logo-mark.svg` | Elephant mark only | Source for the simplified mark. Not used on pages directly |
| `logo-mark-simple.svg` | Mark in solid ivory with the thin inner lines closed | Favicon (`src/app/icon.svg`). Generated: don't edit by hand |
| `badge.svg` | Round badge with the name around the mark | App icons only. **Never in the header** |

## Where each one is used

- **Header** (`SiteHeader` via `BrandLogo`): the two-line lockup below `md`, the horizontal logo from `md` up. One `<picture>`, so each visitor downloads one file. Never the badge.
- **Footer** (`Footer` via `BrandLogo`): the horizontal logo.
- **Both** link to `/{locale}`. The alt text comes from `messages.brand.logoAlt` ("Elephant Archive Sri Lanka"). The Sinhala and Tamil alt text is still the English name and is marked `TODO(si-review)` / `TODO(ta-review)`.
- **Favicon:** `src/app/icon.svg` is `logo-mark-simple.svg` on a rounded Canopy tile, so it shows on light tab bars too.
- **App icons:** made from `badge.svg`:
  - `src/app/apple-icon.png` (180×180)
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `public/icons/icon-maskable-512.png` (the badge inside the 80% safe zone, on Canopy)
- **Manifest:** `src/app/manifest.ts` lists the app icons. It uses Canopy as both background and theme colour.
- **Social image:** `src/app/opengraph-image.png` (1200×630) is `logo-stacked.svg` centred on Canopy. Its alt text is in `opengraph-image.alt.txt`.

## Rules

- **Backgrounds:** only Canopy, Umber or Surface. Previews of each are on `/en/_components#logos` (dev only).
- **Never animate a logo**, in either zone. `BrandLogo` sets `data-logo`, and `globals.css` turns off animation, transitions and transforms on it.
- **Fixed heights in px:**
  - Header: 34 px below `md`, 40 px from `md` up.
  - Footer: 36 px.

  The logo must be the same size on si/ta pages, where rem is 6% larger.
- **Serving:** static SVGs from `public/brand`. No Vercel image optimisation.
- **Don't redraw or recolour a logo in code.** Changes come from the designer as new files.

## Updating the files

1. Put the designer's new file in `design/brand-source/`, and a copy in `public/brand/`.
2. Run `pnpm brand:svg`. It runs SVGO with `svgo.config.mjs`, which keeps the viewBox (adding one from width/height if missing) and strips scripts.
3. Run `pnpm brand:icons`. It rebuilds the simplified mark, favicon, app icons and social image (`scripts/brand-assets.ts`).
4. Check `/en/_components#logos`, then run `pnpm test`. `brand-assets.test.ts` checks sizes, transparency, opacity and the safe zone.

## Known problems with the current files

Checked 2026-11-15. None of these were fixed in code, because that would mean redrawing. They need new exports from the designer.

1. **Off-brand colours everywhere.** All four logo files are auto-traced (VTracer). Each uses 22–108 slightly different shades, and none is an exact brand token. For example, "ivory" appears as `#e8e9dc`, `#eeede0` and dozens more instead of `#f1f0e7`, and "sand" is off by up to ~50 RGB.
   - Fix: re-export from the vector source using only the palette colours.
2. **`badge.svg` and `logo-mark.svg` are not transparent.** Each has an opaque full-canvas square, near-Canopy (`#0f1b19` / `#121c1b`). The badge also has a second green square behind the ring.
   - This is fine for app icons, which sit on Canopy anyway, but neither file can be placed on Umber or Surface.
   - The favicon uses the simplified mark, so it isn't affected.
3. **Letter counters painted dark.** In `logo-horizontal.svg` and `logo-stacked.svg`, the holes inside P, A and R (and some small specks around the elephant) are near-black shapes (`#111b19`–`#17211e`), not transparent.
   - On Canopy they disappear. On Umber they show as faint greenish patches. Compare the Umber row on the preview page.
4. **Thin inner lines vanish at 16 px.** `logo-mark.svg`'s inner lines blur into grey at favicon size, so the favicon uses the simplified copy.
5. **No viewBox** on `badge.svg` and `logo-mark.svg` as delivered. `pnpm brand:svg` now adds one from width/height.
