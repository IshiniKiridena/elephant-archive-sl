import type { Locale } from "@/i18n/config";
import type { PageTranslation } from "@/i18n/fallback";
import type { Messages } from "@/i18n/messages/en";

/**
 * Translation state of a page (design: "Translation states and language fallback").
 * Server components, no client JS, no motion: safe on Quiet pages.
 *
 * - TranslationNote: one note per page, at the top, when some (partial) or all (missing) of the
 *   page's content is shown in English on a si/ta page. Text still under native review counts
 *   as not shown.
 * - TranslationReviewed: a small line at the end when every block is native-approved.
 * - ShownInEnglish: chip above each block that fell back (in ShownInEnglish.tsx).
 */

type Props = {
  locale: Locale;
  state: PageTranslation;
  t: Messages["translation"];
  /** The same page in English, e.g. localeHref("en", path). */
  englishHref: string;
  /** Where to help translate. Omit until that page exists. */
  helpHref?: string;
};

export function TranslationNote({ locale, state, t, englishHref, helpHref }: Props) {
  if (locale === "en" || state === "full") return null;
  const missing = state === "missing";

  return (
    <div role="note" lang={locale} className="flex max-w-4xl flex-wrap items-start gap-x-4 gap-y-3 rounded-card border border-sand bg-surface px-4.5 py-4">
      <TranslateIcon />
      <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-1.5">
        <p className="font-semibold text-ivory">{missing ? t.missingHeading : t.partlyHeading}</p>
        <p className="text-[0.9375rem] text-muted">{missing ? t.missingBody : t.partlyBody}</p>
        <div className="mt-1 flex flex-wrap gap-x-4.5 gap-y-2 text-[0.9375rem]">
          <a href={englishHref} hrefLang="en" className="font-semibold">
            {t.readInEnglish}
          </a>
          {helpHref && (
            <a href={helpHref} className="font-semibold">
              {t.helpTranslate}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function TranslationReviewed({ locale, state, t }: Pick<Props, "locale" | "state" | "t">) {
  if (locale === "en" || state !== "full") return null;
  return (
    <p lang={locale} className="inline-flex items-center gap-2 text-sm text-muted">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-sage">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {t.reviewed}
    </p>
  );
}

const TranslateIcon = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-sand">
    <path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c0 4-3 7-7 8M13 21l4-9 4 9M14.5 18h5" />
  </svg>
);
