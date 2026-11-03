import type { Locale } from "./config";

/**
 * UI strings. English is the source. Sinhala and Tamil entries are added only after
 * translation, and stay listed in NEEDS_NATIVE_REVIEW until a native speaker approves them
 * (project rule 6). A missing si/ta string falls back to English and is rendered with
 * lang="en", so screen readers pronounce it correctly.
 */
const en = {
  siteName: "Elephant Archive Sri Lanka",
  tagline: "An open, labelled record of Sri Lanka's elephants",
  nav: { menu: "Menu", contribute: "Contribute", language: "Language" },
  home: {
    heroTitle: "Every elephant has a story worth knowing",
    heroBody: "Lives, losses, rescues and history, each with its source and how far it has been checked.",
    heroCta: "Explore the record",
  },
  herd: { pause: "Pause", play: "Play" },
  fact: { flip: "Where is this from?", back: "Back", source: "Source", share: "Share card" },
  footer: { legal: "This archive spreads knowledge. It is not an accusation or legal advice." },
};

export type Dictionary = typeof en;
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const si: DeepPartial<Dictionary> = {}; // TODO translate; add keys to NEEDS_NATIVE_REVIEW
const ta: DeepPartial<Dictionary> = {}; // TODO translate; add keys to NEEDS_NATIVE_REVIEW

/** Keys whose si/ta text is machine- or non-native-written and awaiting review. */
export const NEEDS_NATIVE_REVIEW: Record<"si" | "ta", string[]> = { si: [], ta: [] };

const merge = <T extends object>(base: T, over: DeepPartial<T>): T => {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = v && typeof v === "object" && b && typeof b === "object" ? merge(b as object, v as object) : v ?? b;
  }
  return out as T;
};

export function getDictionary(locale: Locale): Dictionary {
  if (locale === "si") return merge(en, si);
  if (locale === "ta") return merge(en, ta);
  return en;
}

/** True when this locale has its own text for a top-level section (else the English fallback is shown). */
export const hasOwnText = (locale: Locale, section: keyof Dictionary) =>
  locale === "en" || !!(locale === "si" ? si : ta)[section];
