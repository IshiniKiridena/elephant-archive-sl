import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { COLLAPSE_AFTER, DATA_LIMIT_KINDS, DataLimits, type DataLimitItem } from "../DataLimits";

// All fixtures are fake placeholders.
const text = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const item = (kind: DataLimitItem["kind"], n: number, over: Partial<DataLimitItem> = {}): DataLimitItem => ({
  kind,
  title: `[Example title ${n}]`,
  explanation: `[Example explanation ${n}]`,
  ...over,
});
const conflict = item("conflict", 3, {
  figures: [
    { value: "[Figure A]", source: "Example Department", date: "2024-01" },
    { value: "[Figure B]", source: "Example News", date: "2024-03-10" },
  ],
});
const few = [item("gap", 1), item("unconfirmed", 2), conflict];
const many = [...few, item("gap", 4), item("gap", 5)];
const render = (items: DataLimitItem[], locale: Locale = "en", extra: Partial<Parameters<typeof DataLimits>[0]> = {}) =>
  renderToStaticMarkup(<DataLimits locale={locale} items={items} {...extra} />);

describe("DataLimits", () => {
  it("renders nothing without items", () => expect(render([])).toBe(""));

  it.each(LOCALES)("in %s: heading, every kind as a word, titles and explanations", (locale) => {
    const t = getMessages(locale).dataLimits;
    const html = render(few, locale);
    expect(html).toContain(text(t.heading));
    for (const k of DATA_LIMIT_KINDS) expect(html).toContain(text(t.kind[k]));
    for (const n of [1, 2, 3]) {
      expect(html).toContain(`[Example title ${n}]`);
      expect(html).toContain(`[Example explanation ${n}]`);
    }
    expect(html).toContain(`<section id="limits" lang="${locale}"`);
  });

  describe("Read more", () => {
    it(`up to ${COLLAPSE_AFTER} items: explanations are open, no <details>`, () => {
      expect(render(few)).not.toContain("<details");
    });
    it(`more than ${COLLAPSE_AFTER} items: each explanation sits in a native <details>`, () => {
      const html = render(many);
      expect(html.match(/<details[ >]/g)).toHaveLength(many.length);
      expect(html).toContain(`Read more<span class="sr-only">: [Example title 4]</span></summary>`);
      expect(html).toMatch(/<details[^>]*>.*\[Example explanation 4\].*<\/details>/);
    });
    it("title headings and conflicting figures stay outside <details>", () => {
      const html = render(many);
      const inner = [...html.matchAll(/<details[^>]*>(.*?)<\/details>/g)];
      expect(inner).toHaveLength(many.length);
      for (const [, inside] of inner) {
        // the summary repeats the title for screen readers only; the visible heading is outside
        expect(inside).not.toMatch(/<h\d/);
        expect(inside).not.toContain("[Figure");
      }
      expect(html).toContain('class="font-semibold break-words text-ivory">[Example title 4]</h3>');
      expect(html).toContain("[Figure A]");
    });
  });

  describe("conflicting figures (rule 2)", () => {
    it("shows every figure with its source and date, in the order given", () => {
      const html = render([conflict]);
      expect(html.indexOf("[Figure A]")).toBeLessThan(html.indexOf("[Figure B]"));
      expect(html).toContain('<time dateTime="2024-01" class="text-sm text-muted">January 2024</time>');
      expect(html).toContain('<time dateTime="2024-03-10" class="text-sm text-muted">10 March 2024</time>');
      expect(html).toContain("Example Department");
      expect(html).toContain(text(getMessages("en").dataLimits.conflictNote));
    });
    it("never picks one: reversing the figures only reverses the order", () => {
      const reversed = { ...conflict, figures: [...conflict.figures!].reverse() };
      const html = render([reversed]);
      expect(html.indexOf("[Figure B]")).toBeLessThan(html.indexOf("[Figure A]"));
      expect(html.match(/text-2xl font-extrabold/g)).toHaveLength(2);
    });
    it("figures are only shown for conflict items", () => {
      const html = render([item("gap", 1, { figures: [{ value: "[Figure Z]", source: "Example", date: null }] })]);
      expect(html).not.toContain("[Figure Z]");
      expect(html).not.toContain(text(getMessages("en").dataLimits.conflictNote));
    });
  });

  it("marks an item that fell back to English", () => {
    const html = render([item("gap", 1, { lang: "en" })], "si");
    expect(html).toContain(text(getMessages("si").translation.shownInEnglish));
    expect(html).toContain('lang="en" class="font-semibold');
  });

  describe("last checked and links", () => {
    it("shows last checked only as precisely as given", () => {
      expect(render(few, "en", { lastChecked: "2024" })).toContain('<time dateTime="2024">2024</time>');
      expect(render(few, "en", { lastChecked: "not a date" })).not.toContain(getMessages("en").dataLimits.lastChecked);
      expect(render(few)).not.toContain(getMessages("en").dataLimits.lastChecked);
    });
    it("links appear only when their href is passed, in the page language", () => {
      const t = getMessages("ta").dataLimits;
      expect(render(few, "ta")).not.toContain("<a ");
      const html = render(few, "ta", { methodHref: "/ta/method", correctionHref: "/ta/correct" });
      expect(html).toContain(`href="/ta/method"`);
      expect(html).toContain(text(t.methodLink));
      expect(html).toContain(text(t.correctionLink));
    });
  });

  it("Quiet zone: token classes only, no motion, transforms or images", () => {
    const file = readFileSync(fileURLToPath(new URL("../DataLimits.tsx", import.meta.url)), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, ""); // code only, not the doc comments
    expect(file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(file).not.toMatch(/style=/);
    expect(file).not.toMatch(/\b(animate-|transition|transform|translate-|scale-|rotate-|duration-)/);
    expect(file).not.toMatch(/<img|<Image|<picture|<video/);
  });
});
