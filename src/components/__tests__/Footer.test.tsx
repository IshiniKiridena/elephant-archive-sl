import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { Footer } from "../Footer";
import { MENU_SECONDARY } from "../MegaMenu";

const text = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const render = (locale: Locale, path = "/deaths/example") => renderToStaticMarkup(<Footer locale={locale} path={path} />);
const code = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const PURPOSE_SHORT = "Not taking sides. Advocating for Sri Lanka's elephants through open, labelled evidence.";

describe("Footer", () => {
  it("is a footer on the Umber background", () => {
    expect(render("en")).toMatch(/^<footer lang="en" class="[^"]*\bbg-umber\b/);
  });

  it("shows the horizontal logo, never the badge", () => {
    const html = render("en");
    expect(html).toContain('src="/brand/logo-horizontal.svg"');
    expect(html).toContain(`alt="${text(getMessages("en").siteName)}"`);
    expect(html).not.toMatch(/badge/i);
  });

  it("uses PurposeStatement (short) for the purpose line, in English until si/ta are approved", () => {
    expect(render("en")).toContain(text(PURPOSE_SHORT));
    const si = render("si");
    expect(si).toContain(`<p lang="en" class="text-sm text-muted">${text(PURPOSE_SHORT)}</p>`);
    expect(si).toContain(text(getMessages("si").translation.shownInEnglish));
  });

  it.each(LOCALES)("in %s: LegalNotice short and the shared secondary links", (locale) => {
    const m = getMessages(locale);
    const html = render(locale);
    expect(html).toContain(text(m.legalNotice.short));
    expect(html).toContain(`aria-label="${text(m.footer.linksLabel)}"`);
    for (const { key, path } of MENU_SECONDARY) {
      expect(html).toContain(`href="/${locale}${path}"`);
      expect(html).toContain(text(m.menu.secondary[key]));
    }
  });

  it.each(LOCALES)("in %s: language links keep the page, current one marked", (locale) => {
    const html = render(locale);
    for (const l of LOCALES) {
      expect(html).toContain(`href="/${l}/deaths/example" hrefLang="${l}" lang="${l}"`);
      expect(html).toContain(`>${LOCALE_LABEL[l].name}</a>`);
    }
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`href="/${locale}/deaths/example"[^>]*aria-current="page"`));
  });

  it("server component, tokens only, no motion in either zone", () => {
    const src = code("../Footer.tsx");
    expect(src).not.toMatch(/["']use client["']/);
    expect(src).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(src).not.toMatch(/style=/);
    const classes = [...render("ta").matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));
    expect(classes.filter((c) => /\b(animate-|transition|duration-|ease-|translate-|scale-|rotate-)/.test(c))).toEqual([]);
  });

  it("copies no text: the legal and purpose lines come only from their components", () => {
    const src = code("../Footer.tsx");
    expect(src).not.toContain("Not taking sides");
    expect(src).not.toContain("legal advice");
  });
});
