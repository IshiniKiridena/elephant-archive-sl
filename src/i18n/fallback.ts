import type { Locale } from "./config";

/**
 * Per-block language fallback for CMS content (design: "Translation states and language fallback").
 *
 * - The URL stays in the chosen language; only the text falls back.
 * - Sinhala/Tamil text is shown only once a native speaker has approved that language
 *   (`translationReview.si/ta === "approved"`). Text still under review is not shown; the
 *   English version is, rendered with lang="en" and a "Shown in English" chip.
 *
 * Fetch content with `locale: "all"` so each localized field arrives as { si, ta, en }.
 * Payload's own `fallback: true` would fill in English silently, and the page could not
 * mark it with lang="en" or the chip.
 */

export type ReviewState = "missing" | "needs_review" | "approved";
/** The `translationReview` group from evidenceFields() / translationReviewField(). */
export type TranslationReview = { si?: ReviewState | null; ta?: ReviewState | null } | null | undefined;
/** A localized field as Payload returns it with `locale: "all"`. */
export type Localized<T> = Partial<Record<Locale, T | null>> | null | undefined;

export interface Shown<T> {
  value: T;
  lang: Locale; // the language the value is actually in
  fellBack: boolean; // true when the visitor asked for si/ta but gets English
}

/** "full": nothing fell back (or English). "partial": some blocks are English. "missing": all are. */
export type PageTranslation = "full" | "partial" | "missing";

const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

export function pickLocalized<T>(field: Localized<T>, locale: Locale, review: TranslationReview): Shown<T | null> {
  const english = field?.en ?? null;
  if (locale === "en") return { value: english, lang: "en", fellBack: false };
  const own = field?.[locale];
  if (review?.[locale] === "approved" && !isEmpty(own)) return { value: own as T, lang: locale, fellBack: false };
  return { value: english, lang: "en", fellBack: true };
}

export function pageTranslation(blocks: Pick<Shown<unknown>, "fellBack">[], locale: Locale): PageTranslation {
  if (locale === "en") return "full";
  const fell = blocks.filter((b) => b.fellBack).length;
  if (fell === 0) return "full";
  return fell === blocks.length ? "missing" : "partial";
}
