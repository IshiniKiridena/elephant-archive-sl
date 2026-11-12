import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/i18n/get-messages";
import { ShownInEnglish } from "../ShownInEnglish";
import { TranslationNote, TranslationReviewed } from "../TranslationNote";

const si = getMessages("si").translation;
const ta = getMessages("ta").translation;
const html = (s: string) => s.replaceAll('"', "&quot;"); // how renderToStaticMarkup escapes text
const note = (props: Partial<Parameters<typeof TranslationNote>[0]> = {}) =>
  renderToStaticMarkup(<TranslationNote locale="si" state="partial" t={si} englishHref="/en/example" {...props} />);

describe("TranslationNote", () => {
  it("renders nothing in English", () => expect(note({ locale: "en", t: getMessages("en").translation })).toBe(""));
  it("renders nothing when the page is fully translated", () => expect(note({ state: "full" })).toBe(""));

  it("partial: 'partly translated' note in the page language", () => {
    const out = note();
    expect(out).toContain('role="note"');
    expect(out).toContain('lang="si"');
    expect(out).toContain(html(si.partlyHeading));
    expect(out).toContain(html(si.partlyBody));
    expect(out).not.toContain(html(si.missingHeading));
  });

  it("missing: 'not translated yet' note", () => {
    const out = note({ locale: "ta", t: ta, state: "missing" });
    expect(out).toContain('lang="ta"');
    expect(out).toContain(html(ta.missingHeading));
    expect(out).toContain(html(ta.missingBody));
    expect(out).not.toContain(html(ta.partlyHeading));
  });

  it("links to the same page in English", () => {
    expect(note()).toContain(`<a href="/en/example" hrefLang="en" class="font-semibold">${si.readInEnglish}</a>`);
  });

  it("shows 'help translate' only when a link is given", () => {
    expect(note()).not.toContain(si.helpTranslate);
    expect(note({ helpHref: "/si/example-help" })).toContain(`href="/si/example-help"`);
  });
});

describe("TranslationReviewed", () => {
  const reviewed = (locale: "si" | "en", state: "full" | "partial") =>
    renderToStaticMarkup(<TranslationReviewed locale={locale} state={state} t={si} />);
  it("shows on a fully approved si/ta page", () => expect(reviewed("si", "full")).toContain(si.reviewed));
  it("hidden while anything falls back", () => expect(reviewed("si", "partial")).toBe(""));
  it("hidden in English", () => expect(reviewed("en", "full")).toBe(""));
});

describe("ShownInEnglish", () => {
  it("renders the chip in the page language when a block fell back", () => {
    const html = renderToStaticMarkup(<ShownInEnglish show locale="si" label={si.shownInEnglish} />);
    expect(html).toContain('lang="si"');
    expect(html).toContain(si.shownInEnglish);
  });
  it("renders nothing when the block did not fall back, or in English", () => {
    expect(renderToStaticMarkup(<ShownInEnglish show={false} locale="si" label="x" />)).toBe("");
    expect(renderToStaticMarkup(<ShownInEnglish show locale="en" label="x" />)).toBe("");
  });
});
