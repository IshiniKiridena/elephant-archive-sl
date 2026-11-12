import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { MENU_SECONDARY, MENU_SECTIONS, MegaMenu } from "../MegaMenu";
import { SiteHeader } from "../SiteHeader";
import { QUIET_SECTIONS } from "@/lib/motion-zone";

const text = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const header = (locale: Locale, extra: Partial<Parameters<typeof SiteHeader>[0]> = {}) =>
  renderToStaticMarkup(<SiteHeader locale={locale} path="/deaths/example" {...extra} />);
const code = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const MOTION = /\b(animate-|transition|duration-|ease-|translate-|scale-|rotate-|starting:)/;
const classes = (html: string) => [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));

describe("SiteHeader", () => {
  describe("language switcher", () => {
    it.each(LOCALES)("on a %s page: same path, only the prefix changes", (locale) => {
      const html = header(locale);
      for (const l of LOCALES) expect(html).toContain(`href="/${l}/deaths/example" hrefLang="${l}" lang="${l}"`);
    });
    it.each(LOCALES)("marks only the current language (%s) with aria-current", (locale) => {
      const html = header(locale);
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
      expect(html).toMatch(new RegExp(`href="/${locale}/deaths/example"[^>]*aria-current="page"`));
    });
    it("labels in their own script, full names for screen readers", () => {
      const html = header("en");
      for (const l of LOCALES) {
        expect(html).toContain(`aria-label="${LOCALE_LABEL[l].name}"`);
        expect(html).toContain(`>${LOCALE_LABEL[l].short}</a>`);
      }
    });
    it("home path keeps the plain prefix", () => {
      expect(header("ta", { path: "" })).toContain('href="/si" hrefLang="si"');
    });
  });

  it.each(LOCALES)("in %s: home link, Contribute (.btn-primary) and Menu, all labelled", (locale) => {
    const m = getMessages(locale);
    const html = header(locale);
    expect(html).toContain(`href="/${locale}" aria-label="${text(m.header.home)}"`);
    expect(html).toMatch(/href="#contribute" class="btn-primary /);
    expect(html).toContain(text(m.nav.contribute));
    expect(html).toContain(text(m.nav.menu));
    expect(html).toContain(`aria-label="${text(m.nav.language)}"`);
  });

  it("logo: stacked below md, horizontal from md, one download via <picture>; never the badge", () => {
    const html = header("en");
    expect(html).toContain('<source media="(min-width: 48rem)" srcSet="/brand/logo-horizontal.svg"');
    expect(html).toMatch(/<img src="\/brand\/logo-stacked.svg" alt="" width="\d+" height="\d+"/);
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).not.toMatch(/badge/i);
    expect(html).not.toContain("data-logo-placeholder");
  });

  it("logo files exist, are cleaned for the web, and carry no scripts", () => {
    const dir = new URL("../../../public/brand/", import.meta.url);
    for (const f of ["logo-stacked.svg", "logo-horizontal.svg"]) {
      const svg = readFileSync(fileURLToPath(new URL(f, dir)), "utf8");
      expect(svg, f).toMatch(/<svg[^>]*viewBox="[\d. ]+"/);
      expect(svg, f).not.toMatch(/<script|\son[a-z]+=|<foreignObject|href="(?!#)/i);
      // The traced full-canvas background rectangle is gone: no shape spans (nearly) the whole width.
      // (Every traced shape starts "M0 0 C…" because each is placed with translate(); compare widths.)
      const vbWidth = Number(svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/)![1]);
      const topEdges = [...svg.matchAll(/<path d="M0 0 C[\d.]+ 0 [\d.]+ 0 ([\d.]+) 0 /g)].map((m) => Number(m[1]));
      expect(Math.max(...topEdges), f).toBeLessThan(vbWidth * 0.9);
    }
  });

  it("Quiet (default): no motion classes anywhere in the header or menu", () => {
    expect(classes(header("en")).filter((c) => MOTION.test(c))).toEqual([]);
  });

  it("Bright: menu motion is opacity + translate, 200 ms, every class motion-safe:", () => {
    const motion = classes(header("en", { zone: "bright" })).filter((c) => MOTION.test(c));
    expect(motion.length).toBeGreaterThan(0);
    for (const c of motion) expect(c, c).toMatch(/^motion-safe:/);
    expect(motion).toContain("motion-safe:transition-[opacity,translate]");
    expect(motion).toContain("motion-safe:duration-200");
  });

  it("can be non-sticky (preview)", () => {
    expect(header("en")).toMatch(/<header lang="en" class="sticky top-0/);
    expect(header("en", { sticky: false })).not.toMatch(/<header[^>]*sticky/);
  });
});

describe("MegaMenu", () => {
  it.each(LOCALES)("in %s: seven sections with title and one-line description, five secondary links", (locale) => {
    const t = getMessages(locale).menu;
    const html = renderToStaticMarkup(<MegaMenu locale={locale} />);
    expect(MENU_SECTIONS).toHaveLength(7);
    for (const { key, path } of MENU_SECTIONS) {
      expect(html).toContain(`href="/${locale}${path}"`);
      expect(html).toContain(text(t.sections[key].title));
      expect(html).toContain(text(t.sections[key].description));
    }
    expect(MENU_SECONDARY).toHaveLength(5);
    for (const { key, path } of MENU_SECONDARY) {
      expect(html).toContain(`href="/${locale}${path}"`);
      expect(html).toContain(text(t.secondary[key]));
    }
    expect(html).toContain(`lang="${locale}"`);
  });

  it("is a native dialog opened by a button that points at it", () => {
    const html = renderToStaticMarkup(<MegaMenu locale="en" />);
    const id = html.match(/aria-controls="([^"]+)"/)![1];
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain(`<dialog id="${id}" lang="en" aria-labelledby="${id}-title"`);
    expect(html).toContain(`id="${id}-title"`);
    expect(html).toContain(text(getMessages("en").menu.close));
  });

  it("Quiet sections in the menu match the Quiet zone list", () => {
    for (const path of ["/deaths", "/court-cases"]) {
      expect(MENU_SECTIONS.some((s) => s.path === path)).toBe(true);
      expect(QUIET_SECTIONS).toContain(path.slice(1));
    }
  });
});

describe("client JS stays minimal", () => {
  it("only MegaMenuDialog is a client component", () => {
    expect(code("../MegaMenuDialog.tsx")).toMatch(/^\s*["']use client["']/);
    for (const f of ["../SiteHeader.tsx", "../MegaMenu.tsx"]) expect(code(f)).not.toMatch(/["']use client["']/);
  });
  it("the client shell imports no message files or other components", () => {
    const imports = [...code("../MegaMenuDialog.tsx").matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(imports).toEqual(["react"]);
  });
  it.each(["../SiteHeader.tsx", "../MegaMenu.tsx", "../MegaMenuDialog.tsx"])("%s: tokens only", (f) => {
    expect(code(f)).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(code(f)).not.toMatch(/style=/);
  });
});
