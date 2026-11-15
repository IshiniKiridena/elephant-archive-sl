/**
 * Builds the favicon, app icons and social image from the logos in public/brand/.
 *   pnpm brand:svg     optimise the SVGs (SVGO, viewBox kept)
 *   pnpm brand:icons   this script
 * Run both after a logo changes, then check the previews on /en/_components#logos.
 * Nothing here redraws a logo: it recolours (simplified mark only), crops, scales and places them.
 * See design/logos.md for which file goes where.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import { optimize, type Config } from "svgo";
import svgoConfig from "../svgo.config.mjs";
import { tokens } from "../src/styles/tokens";

const root = path.resolve(import.meta.dirname, "..");
const brand = (f: string) => path.join(root, "public/brand", f);
const out = (f: string) => {
  const p = path.join(root, f);
  mkdirSync(path.dirname(p), { recursive: true });
  return p;
};

// ── 1. Simplified mark for small sizes ──────────────────────────────────────
// logo-mark.svg's thin inner lines turn into grey smudges at 16 px. The simplified copy keeps the
// shapes, drops the square background and the small dark fragments, fills everything with brand
// ivory, and adds a same-colour outline (OUTLINE units of the 1024 canvas) that closes the hairline
// gaps. All shapes become one path, so no anti-aliasing seams show between them.
const OUTLINE = 20;

const luminance = (hex: string) => {
  const h = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
  const n = parseInt(h.slice(1), 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
/** One path in absolute coordinates, so several can be joined into one path without shifting. */
const absolute = (d: string) =>
  optimize(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`, {
    plugins: [{ name: "convertPathData", params: { forceAbsolutePath: true } }],
  }).data.match(/ d="([^"]+)"/)![1];

async function simplifiedMark() {
  const svg = readFileSync(brand("logo-mark.svg"), "utf8");
  const shapes = [...svg.matchAll(/<path fill="(#[0-9a-f]{3,6})" d="([^"]+)"\/>/gi)]
    .filter(([, fill, d]) => !/^M0 0h\d+v\d+H0z$/.test(d) && luminance(fill) > 0.35) // no background, no dark fragments
    .map(([, , d]) => absolute(d));
  if (shapes.length < 5) throw new Error(`logo-mark.svg: expected the traced shapes, found ${shapes.length}`);
  const body = `<path fill="${tokens.ivory}" stroke="${tokens.ivory}" stroke-width="${OUTLINE}" stroke-linejoin="round" d="${shapes.join(" ")}"/>`;

  // Crop to the artwork (square, 2% padding)
  const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;
  const { info } = await sharp(Buffer.from(probe)).png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const [x, y, w, h] = [-(info.trimOffsetLeft ?? 0), -(info.trimOffsetTop ?? 0), info.width, info.height];
  const side = Math.max(w, h);
  const pad = Math.round(side * 0.02);
  const vb = [Math.round(x + w / 2 - side / 2 - pad), Math.round(y + h / 2 - side / 2 - pad), side + 2 * pad, side + 2 * pad];

  const simple = optimize(`<svg xmlns="http://www.w3.org/2000/svg" width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(" ")}">${body}</svg>`, svgoConfig as Config).data;
  writeFileSync(brand("logo-mark-simple.svg"), simple);
  return { simple, vb, body };
}

// ── 2. Favicon: the simplified mark on a Canopy tile ────────────────────────
// Ivory alone would vanish on a light browser tab bar, so the mark sits on a rounded Canopy square.
function favicon({ vb, body }: { vb: number[]; body: string }) {
  const [x, y, s] = vb;
  const m = Math.round(s * 0.06);
  const side = s + 2 * m;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x - m} ${y - m} ${side} ${side}"><rect x="${x - m}" y="${y - m}" width="${side}" height="${side}" rx="${Math.round(side * 0.18)}" fill="${tokens.canopy}"/>${body}</svg>`;
  writeFileSync(out("src/app/icon.svg"), optimize(svg, svgoConfig as Config).data);
}

// ── 3. App icons from the badge ─────────────────────────────────────────────
const badge = (size: number) => sharp(brand("badge.svg"), { density: 300 }).resize(size, size).png().toBuffer();

/** Save without an alpha channel. (Sharp adds one when compositing, so it is removed in a second pass.) */
const saveOpaque = async (img: Sharp, file: string) =>
  sharp(await img.png().toBuffer()).flatten({ background: tokens.canopy }).removeAlpha().png().toFile(out(file));

async function appIcons() {
  // The badge's own square background is (almost exactly) Canopy; flatten onto Canopy so no pixel is transparent
  const opaque = async (size: number, file: string) => saveOpaque(sharp(await badge(size)), file);
  await opaque(180, "src/app/apple-icon.png");
  await opaque(192, "public/icons/icon-192.png");
  await opaque(512, "public/icons/icon-512.png");

  // Maskable: launchers may crop to a circle of 80% diameter (the safe zone). The badge's ring is
  // ~79% of its width, so at 90% size the ring's diameter is ~71% of the icon: inside, with margin.
  const inner = Math.round(512 * 0.9);
  const off = Math.round((512 - inner) / 2);
  await saveOpaque(
    sharp({ create: { width: 512, height: 512, channels: 3, background: tokens.canopy } }).composite([{ input: await badge(inner), left: off, top: off }]),
    "public/icons/icon-maskable-512.png",
  );
}

// ── 4. Social image: the two-line lockup centred on Canopy ─────────────────
async function socialImage() {
  const [W, H] = [1200, 630];
  const logo = await sharp(brand("logo-stacked.svg"), { density: 300 }).resize({ width: 760 }).png().toBuffer();
  const { width = 0, height = 0 } = await sharp(logo).metadata();
  await saveOpaque(
    sharp({ create: { width: W, height: H, channels: 3, background: tokens.canopy } }).composite([
      { input: logo, left: Math.round((W - width) / 2), top: Math.round((H - height) / 2) },
    ]),
    "src/app/opengraph-image.png",
  );
}

const mark = await simplifiedMark();
favicon(mark);
await appIcons();
await socialImage();
console.log("brand assets written: logo-mark-simple.svg, icon.svg, apple-icon.png, icons/*, opengraph-image.png");
