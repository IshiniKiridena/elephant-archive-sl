import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { SOURCE_TYPES, VERIFICATION_STATUSES } from "@/lib/evidence-labels";
import { LabelChips } from "../LabelChips";

const render = (el: React.ReactElement) => renderToStaticMarkup(el);
const text = (s: string) => s.replaceAll('"', "&quot;").replaceAll("'", "&#x27;"); // renderToStaticMarkup escaping

describe("LabelChips", () => {
  describe.each(LOCALES)("in %s", (locale) => {
    const m = getMessages(locale).evidence;

    it.each(SOURCE_TYPES)("source type %s shows its word with a screen-reader prefix", (st) => {
      const html = render(<LabelChips locale={locale} sourceType={st} />);
      expect(html).toContain(text(m.sourceType[st]));
      expect(html).toContain(`<span class="sr-only">${text(m.sourceTypePrefix)} </span>`);
    });

    it.each(VERIFICATION_STATUSES)("verification %s shows its word with a screen-reader prefix", (v) => {
      const html = render(<LabelChips locale={locale} verification={v} />);
      expect(html).toContain(text(m.verification[v]));
      expect(html).toContain(`<span class="sr-only">${text(m.verificationPrefix)} </span>`);
    });

    it("labels the list and sets lang so si/ta get their own line-height", () => {
      const html = render(<LabelChips locale={locale} sourceType="news" verification="single_source" />);
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain(`aria-label="${text(m.groupLabel)}"`);
    });
  });

  it("every verification status has its own outline style", () => {
    const styles = VERIFICATION_STATUSES.map((v) => render(<LabelChips locale="en" verification={v} />).match(/<li class="([^"]+)"/)?.[1]);
    expect(styles.every(Boolean)).toBe(true);
    // Disputed and Unverified must not look like Verified (colour is a secondary cue, but a consistent one)
    expect(styles[3]).not.toBe(styles[0]);
    expect(styles[4]).not.toBe(styles[0]);
  });

  it("renders nothing when there are no labels", () => {
    expect(render(<LabelChips locale="en" />)).toBe("");
    expect(render(<LabelChips locale="en" sourceType={null} verification="" />)).toBe("");
  });

  it("still shows a word for an unknown value", () => {
    expect(render(<LabelChips locale="en" verification="something_new" />)).toContain("something_new");
  });

  it("accepts the message slice instead of a locale (for client components)", () => {
    const html = render(<LabelChips t={getMessages("ta").evidence} sourceType="news" />);
    expect(html).toContain(getMessages("ta").evidence.sourceType.news);
    expect(html).not.toContain("lang=");
  });

  it("sm and md sizes differ", () => {
    const md = render(<LabelChips locale="en" sourceType="news" />);
    const sm = render(<LabelChips locale="en" sourceType="news" size="sm" />);
    expect(sm).not.toBe(md);
    expect(sm).toContain("text-xs");
  });

  it("uses token classes only, no raw hex", () => {
    const src = readFileSync(fileURLToPath(new URL("../LabelChips.tsx", import.meta.url)), "utf8");
    expect(src).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(src).not.toMatch(/style=/);
  });
});
