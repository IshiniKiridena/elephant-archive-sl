import type { ReactNode } from "react";
import { LabelChips } from "@/components/LabelChips";
import { LOOSE_DATE } from "@/fields/looseDate";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import type { Messages } from "@/i18n/messages/en";
import type { Source } from "@/payload-types";

/**
 * The sources behind one record (design: Source page, "Sources panel on every record").
 * Server component, no client JS, no motion: safe in Bright and Quiet zones.
 *
 * - Each source: labels (LabelChips), title in its own language, publisher, date as precise
 *   as the source gives it, and links to the original and/or the archived copy.
 * - Conflicting figures (rule 2): when sources report different figures, all of them are shown
 *   side by side with their dates, in the order given. The panel never picks or ranks one.
 * - Copyright (rule 7): only the fields below are ever rendered. There is no field for article
 *   text, internal `notes` are never shown, and a quote of 15 words or more is dropped whole
 *   (never trimmed, which would misquote).
 */

/** The Source fields the panel reads. A full Source from Payload fits; nothing else is shown. */
export type PanelSource = Pick<
  Source,
  "id" | "title" | "publisher" | "date" | "url" | "archiveUrl" | "language" | "sourceType" | "verificationStatus" | "linkStatus"
>;

/** One source as cited by a record. `figure` and `quote` belong to the citing record, not to Source. */
export interface SourceCitation {
  source: PanelSource;
  /** What this source reports for the record's figure, as the record stores it (e.g. value "12", counts "elephant deaths in 2024"). */
  figure?: { value: string; counts?: string | null } | null;
  /** A short quote from this source, in its original language. Shown only if under 15 words. */
  quote?: string | null;
}

export const MAX_QUOTE_WORDS = 15;

export const isShortQuote = (q: string | null | undefined): q is string => {
  const words = q?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return words > 0 && words < MAX_QUOTE_WORDS;
};

/** Two or more different figures among the citations. Values are compared as stored, never parsed. */
export const hasConflictingFigures = (citations: SourceCitation[]) =>
  new Set(citations.map((c) => c.figure?.value.trim()).filter(Boolean)).size > 1;

/** Only http(s) links are rendered (archiveUrl is not validated in the collection). */
export const safeHref = (u: string | null | undefined) => {
  const s = u?.trim();
  return s && /^https?:\/\/\S+$/i.test(s) ? s : null;
};

const DATE_LOCALE: Record<Locale, string> = { si: "si-LK", ta: "ta-LK", en: "en-GB" };

/** "2024" | "2024-03" | "2024-03-10" → localized, never more precise than stored (rule 1). */
export function formatLooseDate(date: string | null | undefined, locale: Locale): string | null {
  const d = date?.trim();
  if (!d || !LOOSE_DATE.test(d)) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!m) return String(y);
  const opts: Intl.DateTimeFormatOptions = day
    ? { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }
    : { year: "numeric", month: "long", timeZone: "UTC" };
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], opts).format(new Date(Date.UTC(y, m - 1, day || 1)));
}

/** The language a source's own text (title, publisher, quote) is in, for lang="". */
const sourceLang = (l: PanelSource["language"]) => (l === "si" || l === "ta" || l === "en" ? l : undefined);

type Props = {
  locale: Locale;
  citations: SourceCitation[];
  /** Heading level for "Sources"; the conflict heading is one level below. */
  headingLevel?: 2 | 3;
  /** Unique per page if the panel appears more than once. */
  id?: string;
};

export function SourcesPanel({ locale, citations, headingLevel = 2, id = "sources" }: Props) {
  if (citations.length === 0) return null;
  const t = getMessages(locale).sources;
  const H = `h${headingLevel}` as const;
  const conflict = hasConflictingFigures(citations);

  return (
    <section lang={locale} aria-labelledby={`${id}-heading`} className="flex min-w-0 flex-col gap-4">
      <H id={`${id}-heading`} className="text-2xl font-bold text-ivory">
        {t.heading}
      </H>

      {conflict && <FigureComparison citations={citations} locale={locale} t={t} headingLevel={headingLevel === 2 ? 3 : 4} />}

      <ul className="flex flex-col gap-2.5">
        {citations.map((c) => (
          <SourceItem key={c.source.id} citation={c} locale={locale} t={t} showFigure={!conflict} />
        ))}
      </ul>
    </section>
  );
}

function SourceItem({ citation, locale, t, showFigure }: { citation: SourceCitation; locale: Locale; t: Messages["sources"]; showFigure: boolean }) {
  const { source: s, figure, quote } = citation;
  const lang = sourceLang(s.language);
  const date = formatLooseDate(s.date, locale);
  const original = safeHref(s.url);
  const archive = safeHref(s.archiveUrl);
  const status = s.linkStatus && s.linkStatus !== "live" ? s.linkStatus : null;
  // Removed or unreachable pages lead with the archived copy; the original stays only if there is no copy to offer
  const showOriginal = original && (status === null || status === "corrected" || (status === "unreachable" && !archive));

  return (
    <li className="card flex min-w-0 flex-col gap-2 px-4.5 py-4">
      <LabelChips size="sm" locale={locale} sourceType={s.sourceType} verification={s.verificationStatus} />
      <p lang={lang} className="font-semibold break-words text-ivory">
        {s.title}
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
        {s.publisher && <span lang={lang}>{s.publisher}</span>}
        {date && (
          <span>
            {t.published} <time dateTime={s.date!}>{date}</time>
          </span>
        )}
        {!original && !archive && <span>{t.offline}</span>}
      </p>

      {showFigure && figure?.value && (
        <p className="text-sm text-ivory">
          <span className="font-semibold">{figure.value}</span>
          {figure.counts && <span className="text-muted"> · {figure.counts}</span>}
        </p>
      )}

      {isShortQuote(quote) && (
        <blockquote className="border-s-2 border-sand/40 ps-3 text-sm text-ivory">
          <q lang={lang}>{quote.trim()}</q>
        </blockquote>
      )}

      {status && (
        <p className="text-sm text-sand">
          {t.linkStatus[status]}
          {archive && status !== "corrected" && ` ${t.archiveKept}`}
        </p>
      )}

      {(showOriginal || archive) && (
        <p className="flex flex-wrap gap-x-5 text-sm">
          {showOriginal && (
            <ExternalLink href={original} hrefLang={lang} offSite={t.offSite}>
              {t.openOriginal}
            </ExternalLink>
          )}
          {archive && (
            <ExternalLink href={archive} hrefLang={lang} offSite={t.offSite}>
              {t.openArchived}
            </ExternalLink>
          )}
        </p>
      )}
    </li>
  );
}

/** All reported figures side by side, each with its source and date. Equal weight, original order. */
function FigureComparison({
  citations,
  locale,
  t,
  headingLevel,
}: {
  citations: SourceCitation[];
  locale: Locale;
  t: Messages["sources"];
  headingLevel: 3 | 4;
}) {
  const H = `h${headingLevel}` as const;
  return (
    <div className="flex flex-col gap-4 rounded-card border border-sand bg-umber p-5">
      <div className="flex flex-col gap-1.5">
        <H className="text-xl font-bold text-ivory">{t.conflictHeading}</H>
        <p className="text-[0.9375rem] text-muted">{t.conflictBody}</p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3.5">
        {citations
          .filter((c) => c.figure?.value)
          .map(({ source: s, figure }) => {
            const date = formatLooseDate(s.date, locale);
            return (
              <li key={s.id} className="flex min-w-0 flex-col gap-1.5 rounded-card border border-sand/20 bg-canopy p-4">
                <span lang={sourceLang(s.language)} className="text-sm font-semibold break-words text-sand">
                  {s.publisher || s.title}
                </span>
                <span className="text-3xl font-extrabold leading-tight break-words text-ivory">{figure!.value}</span>
                <span className="text-sm text-muted">
                  {figure!.counts}
                  {figure!.counts && date && " · "}
                  {date && (
                    <>
                      {t.published} <time dateTime={s.date!}>{date}</time>
                    </>
                  )}
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function ExternalLink({ href, hrefLang, offSite, children }: { href: string; hrefLang?: string; offSite: string; children: ReactNode }) {
  return (
    <a href={href} hrefLang={hrefLang} rel="external noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-semibold">
      {children}
      <span className="sr-only"> {offSite}</span>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </svg>
    </a>
  );
}
