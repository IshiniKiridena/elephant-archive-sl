import { ShownInEnglish } from "@/components/i18n/ShownInEnglish";
import { formatLooseDate } from "@/components/SourcesPanel";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

/**
 * "Limits of this data" (design: Deaths dashboard; ui-inspiration §2, "on every data page").
 * Quiet zone: server component, no client JS, no animation or transforms, no images.
 *
 * Every word of content comes from props; the component holds no facts or figures.
 * - gap: records that may be missing, and why
 * - unconfirmed: causes shown as reported, not confirmed
 * - conflict: figures that disagree, each shown with its source and date, side by side,
 *   in the order given. Never resolved, ranked or summed (rule 2).
 * With many items, explanations move into a native <details> "Read more"; titles and
 * conflicting figures always stay visible.
 */

export const DATA_LIMIT_KINDS = ["gap", "unconfirmed", "conflict"] as const;
export type DataLimitKind = (typeof DATA_LIMIT_KINDS)[number];

export interface DataLimitItem {
  kind: DataLimitKind;
  /** Short, one line. */
  title: string;
  explanation: string;
  /** conflict only: every figure as reported, with where and when. */
  figures?: { value: string; source: string; date?: string | null }[];
  /** The language title and explanation are actually in, when it differs from the page (fallback). */
  lang?: Locale;
}

/** More items than this and explanations collapse behind "Read more". */
export const COLLAPSE_AFTER = 3;

type Props = {
  locale: Locale;
  items: DataLimitItem[];
  /** YYYY, YYYY-MM or YYYY-MM-DD; shown only as precisely as given. */
  lastChecked?: string | null;
  methodHref?: string;
  correctionHref?: string;
  headingLevel?: 2 | 3;
  /** Anchor target; pages link to "#limits". Unique per page. */
  id?: string;
};

export function DataLimits({ locale, items, lastChecked, methodHref, correctionHref, headingLevel = 2, id = "limits" }: Props) {
  if (items.length === 0) return null;
  const m = getMessages(locale);
  const t = m.dataLimits;
  const H = `h${headingLevel}` as const;
  const Item = `h${headingLevel + 1}` as "h3" | "h4";
  const collapse = items.length > COLLAPSE_AFTER;
  const checked = formatLooseDate(lastChecked, locale);

  return (
    <section id={id} lang={locale} aria-labelledby={`${id}-heading`} className="flex min-w-0 flex-col gap-4 rounded-card border border-sand/30 bg-umber p-5 md:p-6">
      <H id={`${id}-heading`} className="text-[1.375rem] font-bold text-ivory">
        {t.heading}
      </H>

      <ul className="flex max-w-[86ch] flex-col gap-4">
        {items.map((item, i) => {
          const lang = item.lang ?? locale;
          const explanation = (
            <p lang={lang} className="text-[0.9375rem] break-words text-ivory">
              {item.explanation}
            </p>
          );
          return (
            <li key={i} className="flex min-w-0 flex-col gap-1.5 border-t border-sand/20 pt-4 first:border-t-0 first:pt-0">
              <span className="text-xs font-semibold text-sand">{t.kind[item.kind]}</span>
              <ShownInEnglish show={lang !== locale} locale={locale} label={m.translation.shownInEnglish} />
              <Item lang={lang} className="font-semibold break-words text-ivory">
                {item.title}
              </Item>

              {collapse ? (
                <details className="group">
                  {/* flex drops the native marker, so a static +/− shows the state (swapped, never rotated) */}
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-sand hover:text-ivory [&::-webkit-details-marker]:hidden">
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" className="group-open:hidden" />
                    </svg>
                    {t.readMore}
                    <span className="sr-only">: {item.title}</span>
                  </summary>
                  {explanation}
                </details>
              ) : (
                explanation
              )}

              {item.kind === "conflict" && item.figures && item.figures.length > 0 && (
                <div className="mt-1 flex flex-col gap-2">
                  <ul className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-2.5">
                    {item.figures.map((f, j) => {
                      const date = formatLooseDate(f.date, locale);
                      return (
                        <li key={j} className="flex min-w-0 flex-col gap-1 rounded-card border border-sand/20 bg-canopy p-3.5">
                          <span lang={lang} className="text-sm font-semibold break-words text-sand">
                            {f.source}
                          </span>
                          <span className="text-2xl font-extrabold leading-tight break-words text-ivory">{f.value}</span>
                          {date && (
                            <time dateTime={f.date!} className="text-sm text-muted">
                              {date}
                            </time>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-sm text-muted">{t.conflictNote}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {(checked || methodHref || correctionHref) && (
        <div className="flex flex-col gap-1 border-t border-sand/20 pt-3">
          {checked && (
            <p className="text-sm text-muted">
              {t.lastChecked} <time dateTime={lastChecked!}>{checked}</time>
            </p>
          )}
          {(methodHref || correctionHref) && (
            <p className="flex flex-wrap gap-x-5 text-[0.9375rem]">
              {methodHref && (
                <a href={methodHref} className="inline-flex min-h-11 items-center font-semibold">
                  {t.methodLink}
                </a>
              )}
              {correctionHref && (
                <a href={correctionHref} className="inline-flex min-h-11 items-center font-semibold">
                  {t.correctionLink}
                </a>
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
