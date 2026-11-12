import { describe, expect, it } from "vitest";
import { pageTranslation, pickLocalized, type Localized, type TranslationReview } from "../fallback";

const field: Localized<string> = { en: "[Example text]", si: "[Example si placeholder]", ta: "[Example ta placeholder]" };
const approved: TranslationReview = { si: "approved", ta: "approved" };

describe("pickLocalized", () => {
  it("English always shows English, never as a fallback", () => {
    expect(pickLocalized(field, "en", { si: "missing", ta: "missing" })).toEqual({ value: "[Example text]", lang: "en", fellBack: false });
  });
  it("shows approved si/ta text in its own language", () => {
    expect(pickLocalized(field, "si", approved)).toEqual({ value: "[Example si placeholder]", lang: "si", fellBack: false });
    expect(pickLocalized(field, "ta", approved)).toEqual({ value: "[Example ta placeholder]", lang: "ta", fellBack: false });
  });
  it.each([["needs_review"], ["missing"], [null]] as const)("falls back to English when review is %j", (state) => {
    expect(pickLocalized(field, "si", { si: state, ta: "approved" })).toEqual({ value: "[Example text]", lang: "en", fellBack: true });
  });
  it("falls back when there is no review group at all", () => {
    expect(pickLocalized(field, "ta", undefined).fellBack).toBe(true);
  });
  it.each([[null], [""], ["   "], [undefined]])("falls back when approved but the si value is %j", (v) => {
    expect(pickLocalized({ ...field, si: v }, "si", approved)).toEqual({ value: "[Example text]", lang: "en", fellBack: true });
  });
  it("review state is per language", () => {
    const review: TranslationReview = { si: "approved", ta: "needs_review" };
    expect(pickLocalized(field, "si", review).lang).toBe("si");
    expect(pickLocalized(field, "ta", review).lang).toBe("en");
  });
  it("handles a missing field", () => {
    expect(pickLocalized(undefined, "si", approved)).toEqual({ value: null, lang: "en", fellBack: true });
  });
});

describe("pageTranslation", () => {
  const ok = { fellBack: false };
  const fell = { fellBack: true };
  it("English is always full", () => expect(pageTranslation([fell, fell], "en")).toBe("full"));
  it("full when nothing fell back", () => expect(pageTranslation([ok, ok], "si")).toBe("full"));
  it("partial when some blocks fell back", () => expect(pageTranslation([ok, fell], "ta")).toBe("partial"));
  it("missing when every block fell back", () => expect(pageTranslation([fell, fell], "si")).toBe("missing"));
});
