import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { BrandLogo } from "@/components/BrandLogo";
import { LOCALES } from "@/i18n/config";
import { tokens } from "@/styles/tokens";
import manifest from "@/app/manifest";

/** Brand files and the icons built from them (pnpm brand:svg, pnpm brand:icons; design/logos.md). */
const file = (rel: string) => fileURLToPath(new URL(`../../../${rel}`, import.meta.url));
const read = (rel: string) => readFileSync(file(rel), "utf8");
const BRAND = readdirSync(file("public/brand")).filter((f) => f.endsWith(".svg"));

/** Alpha of the four corner pixels of an SVG rendered at 200 px wide. */
async function cornerAlpha(rel: string) {
  const { data, info } = await sharp(file(rel)).resize({ width: 200 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
  const [w, h] = [info.width - 1, info.height - 1];
  return [at(0, 0), at(w, 0), at(0, h), at(w, h)];
}

describe("brand SVGs (public/brand)", () => {
  it("has the five files design/logos.md names", () => {
    expect(BRAND.sort()).toEqual(["badge.svg", "logo-horizontal.svg", "logo-mark-simple.svg", "logo-mark.svg", "logo-stacked.svg"]);
  });

  it.each(BRAND)("%s: keeps a viewBox, and has no scripts, embedded images, styles or outside links", (f) => {
    const svg = read(`public/brand/${f}`);
    expect(svg).toMatch(/<svg[^>]*\sviewBox="[-\d. ]+"/);
    expect(svg).not.toMatch(/<script|<image|<foreignObject|<style|\son[a-z]+=|data:|href="(?!#)/i);
  });

  it.each(["logo-horizontal.svg", "logo-stacked.svg", "logo-mark-simple.svg"])("%s has a transparent background", async (f) => {
    expect(await cornerAlpha(`public/brand/${f}`)).toEqual([0, 0, 0, 0]);
  });

  it("the simplified mark is one solid brand ivory shape", () => {
    const fills = [...read("public/brand/logo-mark-simple.svg").matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1].toLowerCase());
    expect(new Set(fills)).toEqual(new Set([tokens.ivory]));
  });
});

describe("favicon, app icons and social image", () => {
  it("favicon is the simplified mark on a Canopy tile", () => {
    const svg = read("src/app/icon.svg");
    expect(svg).toMatch(/<svg[^>]*viewBox=/);
    expect(svg).toContain(`fill="${tokens.canopy}"`);
    expect(svg).toContain(tokens.ivory);
    expect(svg).not.toMatch(/<script|<image|data:/i);
  });

  it.each([
    ["src/app/apple-icon.png", 180, 180],
    ["public/icons/icon-192.png", 192, 192],
    ["public/icons/icon-512.png", 512, 512],
    ["public/icons/icon-maskable-512.png", 512, 512],
    ["src/app/opengraph-image.png", 1200, 630],
  ])("%s is %ix%i and fully opaque", async (f, w, h) => {
    const m = await sharp(file(f)).metadata();
    expect([m.width, m.height, m.hasAlpha]).toEqual([w, h, false]);
  });

  it("maskable icon keeps the badge inside the safe zone (circle of 80% diameter) on Canopy", async () => {
    const { data, info } = await sharp(file("public/icons/icon-maskable-512.png")).raw().toBuffer({ resolveWithObject: true });
    const canopy = [1, 3, 5].map((i) => parseInt(tokens.canopy.slice(i, i + 2), 16));
    const c = info.width / 2;
    let outside = 0;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        if (Math.hypot(x + 0.5 - c, y + 0.5 - c) <= info.width * 0.4) continue;
        const i = (y * info.width + x) * info.channels;
        if (canopy.some((v, k) => Math.abs(data[i + k] - v) > 6)) outside++;
      }
    expect(outside).toBe(0); // nothing but (near-)Canopy outside the safe circle
  });

  it("social image has alt text", () => {
    expect(read("src/app/opengraph-image.alt.txt").trim()).toBe("Elephant Archive Sri Lanka");
  });
});

describe("manifest", () => {
  const m = manifest();
  it("names the site and uses Canopy for background and theme", () => {
    expect(m.name).toBe("Elephant Archive Sri Lanka");
    expect([m.background_color, m.theme_color]).toEqual([tokens.canopy, tokens.canopy]);
  });
  it("lists the generated icons, including a maskable one, and every file exists", () => {
    expect(m.icons?.map((i) => i.purpose)).toEqual(["any", "any", "maskable"]);
    for (const i of m.icons ?? []) expect(existsSync(file(`public${i.src}`)), i.src).toBe(true);
  });
});

describe("BrandLogo", () => {
  const MOTION = /\b(animate-|transition|duration-|ease-|translate-|scale-|rotate-)/;

  it.each(LOCALES)("links to /%s and never animates (data-logo, no motion classes)", (locale) => {
    for (const variant of ["header", "footer"] as const) {
      const html = renderToStaticMarkup(BrandLogo({ locale, variant }));
      expect(html).toMatch(new RegExp(`^<a href="/${locale}" data-logo=""`));
      expect(html).not.toMatch(MOTION);
      expect(html).not.toMatch(/badge/i);
    }
  });

  it("globals.css switches off animation, transitions and transforms on [data-logo]", () => {
    const css = read("src/styles/globals.css");
    expect(css).toMatch(/\[data-logo\],\s*\[data-logo\] \*\s*\{[^}]*animation: none !important;[^}]*transition: none !important;[^}]*transform: none !important;/);
  });
});
