import type { Locale } from "@/i18n/config";
import { ShownInEnglish } from "@/components/i18n/ShownInEnglish";

/**
 * "Why this archive exists": we take no side; we advocate for Sri Lanka's elephants
 * and tuskers through open, labelled evidence. Canonical text: design/advocacy-engagement.md §0.
 *
 * si / ta are intentionally null until translated AND approved by a native speaker (rule 6).
 * Until then the English text is shown with lang="en" and a "Shown in English" chip, so screen
 * readers pronounce it correctly and readers know why. Move these strings to the translation
 * files once approved.
 */
const COPY: Record<Locale, { heading: string; body: string; short: string } | null> = {
  en: {
    heading: "Why this archive exists",
    body:
      "Elephant Archive Sri Lanka does not take sides. It is an independent effort to raise awareness and advocate for the protection of Sri Lanka's elephants and tuskers, which we believe is an urgent need. We do this through transparency: every figure and story shows where it came from and how far it has been checked, so you can judge it for yourself. Farmers, villagers, wildlife officers and elephants are all part of this story, and we want a future where both people and elephants are safe.",
    short: "Not taking sides. Advocating for Sri Lanka's elephants through open, labelled evidence.",
  },
  si: null, // TODO translate → translationReview.si = "needs_review" until a native speaker approves
  ta: null, // TODO translate → translationReview.ta = "needs_review" until a native speaker approves
};

/** The language the purpose statement is actually shown in for this locale. */
export const purposeLang = (locale: Locale): Locale => (COPY[locale] ? locale : "en");

export function PurposeStatement({
  locale,
  variant = "full",
  shownInEnglish,
}: {
  locale: Locale;
  variant?: "full" | "short" | "collapsed";
  /** Chip label (messages.translation.shownInEnglish); shown when the text falls back. */
  shownInEnglish?: string;
}) {
  const lang = purposeLang(locale);
  const c = COPY[lang]!;
  const chip = shownInEnglish ? <ShownInEnglish show={lang !== locale} locale={locale} label={shownInEnglish} /> : null;

  if (variant === "short") {
    return (
      <div className="flex flex-col gap-1.5">
        {chip}
        <p lang={lang} className="text-sm text-muted">
          {c.short}
        </p>
      </div>
    );
  }

  if (variant === "collapsed") {
    // Quiet pages: sits beside LegalNotice, closed by default, no motion
    return (
      <details lang={lang} className="card p-4">
        <summary className="cursor-pointer text-ivory">{c.heading}</summary>
        {chip && <div className="mt-2 flex">{chip}</div>}
        <p className="mt-2 text-muted prose-measure">{c.body}</p>
      </details>
    );
  }

  return (
    <section className="purpose flex flex-col" aria-labelledby="purpose-heading">
      {chip && <div className="mb-2 flex">{chip}</div>}
      <h2 id="purpose-heading" lang={lang}>
        {c.heading}
      </h2>
      <p lang={lang}>{c.body}</p>
    </section>
  );
}
