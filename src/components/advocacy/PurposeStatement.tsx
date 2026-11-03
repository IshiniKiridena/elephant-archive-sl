/**
 * "Why this archive exists": we take no side; we advocate for Sri Lanka's elephants
 * and tuskers through open, labelled evidence. Canonical text: design/advocacy-engagement.md §0.
 *
 * si / ta are intentionally null until translated AND approved by a native speaker (rule 6).
 * Until then the English text is shown with lang="en" so screen readers pronounce it correctly.
 * Move these strings to the translation files once approved.
 */
type Locale = "si" | "ta" | "en";

const COPY: Record<Locale, { heading: string; body: string; short: string } | null> = {
  en: {
    heading: "Why this archive exists",
    body:
      "Elephant Archive Sri Lanka does not take sides. It is an independent effort to raise awareness and advocate for the protection of Sri Lanka's elephants and tuskers, which we believe is an urgent need. We do this through transparency: every figure and story shows where it came from and how far it has been checked, so you can judge it for yourself. Farmers, villagers, wildlife officers and elephants are all part of this story, and we want a future where both people and elephants are safe.",
    short: "Not taking sides. Advocating for Sri Lanka's elephants through open, labelled evidence.",
  },
  si: null, // TODO translate → needsNativeReview
  ta: null, // TODO translate → needsNativeReview
};

export function PurposeStatement({
  locale,
  variant = "full",
}: {
  locale: Locale;
  variant?: "full" | "short" | "collapsed";
}) {
  const lang: Locale = COPY[locale] ? locale : "en";
  const c = COPY[lang]!;

  if (variant === "short") {
    return (
      <p lang={lang} className="text-sm text-muted">
        {c.short}
      </p>
    );
  }

  if (variant === "collapsed") {
    // Quiet pages: sits beside LegalNotice, closed by default, no motion
    return (
      <details lang={lang} className="card p-4">
        <summary className="cursor-pointer text-ivory">{c.heading}</summary>
        <p className="mt-2 text-muted prose-measure">{c.body}</p>
      </details>
    );
  }

  return (
    <section lang={lang} className="purpose" aria-labelledby="purpose-heading">
      <h2 id="purpose-heading">{c.heading}</h2>
      <p>{c.body}</p>
    </section>
  );
}
