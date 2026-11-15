import type { ReactNode } from "react";
import { LabelChips } from "@/components/LabelChips";
import { SourcesPanel, formatLooseDate, hasConflictingFigures, safeHref, type SourceCitation } from "@/components/SourcesPanel";
import { ShownInEnglish } from "@/components/i18n/ShownInEnglish";
import { TranslationNote } from "@/components/i18n/TranslationNote";
import { localeHref, type Locale } from "@/i18n/config";
import { pageTranslation } from "@/i18n/fallback";
import { getMessages } from "@/i18n/get-messages";
import type { Messages } from "@/i18n/messages/en";
import type { CitingRecord, PublicSource } from "@/lib/sources/get-source";
import { CopyCitation } from "./CopyCitation";

/**
 * Body of the public Source page (design: Source.dc.html). Server component; the only client JS is
 * the Copy citation button. No motion, colour/border changes only.
 *
 * - The source's own title and publisher are shown in their original language (lang="…"), never
 *   translated, so they don't count as English fallback. The TranslationNote follows the citing
 *   records' titles (pageTranslation), which is the only translated content on this page.
 * - Rule 7: only the fields in PublicSource are rendered; there is no article text to show.
 * - Rule 2: when this source is disputed and a citing record carries the conflicting figures, they
 *   are shown side by side by SourcesPanel. A source has no figures of its own, so nothing is shown
 *   until records exist (Phase 1).
 */

type Props = {
  source: PublicSource;
  locale: Locale;
  records: CitingRecord[];
  /** Citations (with figures) of a record that disagrees about a figure; shown when the source is disputed. */
  conflicts?: SourceCitation[];
};

/** Sinhala/Tamil headings need less line-height than their body text (CLAUDE.md UI rules). */
const H = "font-bold text-ivory [&:is(:lang(si),:lang(ta))]:leading-[1.3]";
const EYEBROW = "text-xs font-semibold uppercase tracking-[0.14em] text-sand";

const sourceLang = (l: PublicSource["language"]) => (l === "si" || l === "ta" || l === "en" ? l : undefined);

/** "Publisher. "Title". 10 March 2024. https://…. Accessed 3 March 2026." Only the parts we have. */
export function citationText(s: PublicSource, locale: Locale, t: Messages["sourcePage"]): string {
  const accessed = formatLooseDate(s.accessedAt?.slice(0, 10), locale);
  return (
    [s.publisher, `"${s.title}"`, formatLooseDate(s.date, locale), safeHref(s.url) ?? safeHref(s.archiveUrl), accessed && `${t.accessed} ${accessed}`]
      .filter(Boolean)
      .join(". ") + "."
  );
}

export function SourceDetail({ source: s, locale, records, conflicts = [] }: Props) {
  const m = getMessages(locale);
  const t = m.sourcePage;
  const lang = sourceLang(s.language);
  const date = formatLooseDate(s.date, locale);
  const accessed = formatLooseDate(s.accessedAt?.slice(0, 10), locale);
  const original = safeHref(s.url);
  const archive = safeHref(s.archiveUrl);
  const status = s.linkStatus ?? "live";
  // Same rule as SourcesPanel: a removed or unreachable page leads with the archived copy
  const showOriginal = !!original && (status === "live" || status === "corrected" || (status === "unreachable" && !archive));
  const languageName = s.language ? t.languageName[s.language] : null;
  const state = pageTranslation(records.map((r) => r.title), locale);
  const path = `/sources/${s.slug}`;

  return (
    <div lang={locale} className="mx-auto max-w-[1240px] px-4 pb-24 pt-7 md:px-6">
      <nav aria-label={t.breadcrumb} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <a href={localeHref(locale)}>{t.home}</a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href={localeHref(locale, "/sources")}>{m.menu.secondary.sources}</a>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ivory">
            {t.eyebrow}
          </li>
        </ol>
      </nav>

      {state !== "full" && (
        <div className="mt-4.5">
          <TranslationNote locale={locale} state={state} t={m.translation} englishHref={localeHref("en", path)} />
        </div>
      )}

      {/* Title block */}
      <section aria-labelledby="source-title" className="flex flex-col gap-4 border-b border-sand/20 pb-8 pt-9">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em] text-sand">{t.eyebrow}</span>
          <LabelChips locale={locale} sourceType={s.sourceType} verification={s.verificationStatus} />
        </div>
        <h1 id="source-title" lang={lang} className={`${H} max-w-[28ch] break-words text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.18]`}>
          {s.title}
        </h1>
        <p className="flex flex-wrap gap-x-4.5 gap-y-1.5 text-[0.9375rem] text-muted">
          {s.publisher && <span lang={lang}>{s.publisher}</span>}
          {date && (
            <span>
              {m.sources.published} <time dateTime={s.date!}>{date}</time>
            </span>
          )}
          {languageName && (
            <span>
              {t.language}: {languageName}
            </span>
          )}
        </p>

        <LinkBanner status={status} hasLink={!!(original || archive)} hasArchive={!!archive} accessed={accessed} m={m} />

        <div className="mt-1 flex flex-wrap gap-3">
          {showOriginal && (
            <ExternalButton href={original} hrefLang={lang} primary offSite={m.sources.offSite} icon={EXTERNAL_ICON}>
              {m.sources.openOriginal}
            </ExternalButton>
          )}
          {archive && (
            <ExternalButton href={archive} hrefLang={lang} primary={!showOriginal} offSite={m.sources.offSite} icon={ARCHIVE_ICON}>
              {m.sources.openArchived}
            </ExternalButton>
          )}
          <CopyCitation text={citationText(s, locale, t)} label={t.copyCitation} copiedLabel={t.citationCopied} />
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-10 pt-10">
        {/* Main column */}
        <div className="flex min-w-0 flex-[999_1_35rem] flex-col gap-10">
          <section aria-labelledby="labels-title" className="flex flex-col gap-3.5">
            <h2 id="labels-title" className={`${H} text-2xl`}>
              {t.labelsHeading}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-3.5">
              {s.sourceType && (
                <LabelCard heading={t.sourceTypeHeading} text={t.sourceTypeText[s.sourceType]}>
                  <LabelChips locale={locale} sourceType={s.sourceType} />
                </LabelCard>
              )}
              {s.verificationStatus && (
                <LabelCard heading={t.verificationHeading} text={t.verificationText[s.verificationStatus]}>
                  <LabelChips locale={locale} verification={s.verificationStatus} />
                </LabelCard>
              )}
            </div>
            <a href={localeHref(locale, "/methodology")} className="self-start text-[0.9375rem] font-semibold">
              {t.methodLink}
            </a>
          </section>

          {s.verificationStatus === "disputed" && hasConflictingFigures(conflicts) && (
            <SourcesPanel locale={locale} citations={conflicts} id="dispute" />
          )}

          <section aria-labelledby="records-title" className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="records-title" className={`${H} text-2xl`}>
                {t.recordsHeading}
              </h2>
              {records.length > 0 && <span className="text-sm text-muted">{t.recordsNote}</span>}
            </div>
            {records.length === 0 ? (
              <p className="text-[0.9375rem] text-muted">{t.noRecords}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {records.map((r) => (
                  <li key={r.key}>
                    <a href={r.href} className="card flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4.5 py-4 text-ivory no-underline">
                      <span className="shrink-0 rounded-full border border-sand/40 px-2.5 py-px text-xs text-sand">{r.kind}</span>
                      <span className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1">
                        <ShownInEnglish show={r.title.fellBack} locale={locale} label={m.translation.shownInEnglish} />
                        <span lang={r.title.lang} className="font-semibold break-words">
                          {r.title.value}
                        </span>
                        {r.meta && <span className="text-sm text-muted">{r.meta}</span>}
                      </span>
                      <LabelChips size="sm" locale={locale} sourceType={r.sourceType} verification={r.verificationStatus} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="prose-measure text-sm text-muted">{t.copyright}</p>
        </div>

        {/* Aside */}
        <aside aria-label={t.detailsLabel} className="flex min-w-0 flex-[1_1_18.75rem] flex-col gap-4">
          <section aria-labelledby="details-title" className="card p-5.5">
            <h2 id="details-title" className={`mb-3 ${EYEBROW} text-[0.8125rem]`}>
              {t.detailsHeading}
            </h2>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
              <Detail term={t.publisher}>{s.publisher ? <span lang={lang}>{s.publisher}</span> : t.none}</Detail>
              <Detail term={m.sources.published}>{date ? <time dateTime={s.date!}>{date}</time> : t.none}</Detail>
              <Detail term={t.language}>{languageName ?? t.none}</Detail>
              <Detail term={t.sourceTypeHeading}>{s.sourceType ? m.evidence.sourceType[s.sourceType] : t.none}</Detail>
              <Detail term={t.verification}>{s.verificationStatus ? m.evidence.verification[s.verificationStatus] : t.none}</Detail>
              <Detail term={t.link}>{original ? t.linkLabel[status] : m.sources.offline}</Detail>
              {accessed && (
                <Detail term={t.lastChecked}>
                  <time dateTime={s.accessedAt!.slice(0, 10)}>{accessed}</time>
                </Detail>
              )}
              <Detail term={t.archivedCopy}>
                {archive ? (
                  <a href={archive} rel="external noopener noreferrer">
                    {m.sources.openArchived}
                    <span className="sr-only"> {m.sources.offSite}</span>
                  </a>
                ) : (
                  t.none
                )}
              </Detail>
            </dl>
          </section>

          <section aria-labelledby="cite-title" className="card flex flex-col gap-2.5 p-5.5">
            <h2 id="cite-title" className={`${EYEBROW} text-[0.8125rem]`}>
              {t.citeHeading}
            </h2>
            <p className="rounded-lg bg-canopy px-3.5 py-3 text-sm break-words text-ivory">{citationText(s, locale, t)}</p>
          </section>

          <section aria-labelledby="wrong-title" className="flex flex-col gap-2.5 rounded-card border border-sand/20 bg-umber p-5.5">
            <h2 id="wrong-title" className={`${H} text-lg`}>
              {t.wrongHeading}
            </h2>
            <p className="text-sm text-muted">{t.wrongBody}</p>
            <a href={localeHref(locale, "/contribute")} className="inline-flex min-h-11 items-center self-start font-semibold">
              {t.reportCorrection}
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

function LinkBanner({
  status,
  hasLink,
  hasArchive,
  accessed,
  m,
}: {
  status: NonNullable<PublicSource["linkStatus"]>;
  hasLink: boolean;
  hasArchive: boolean;
  accessed: string | null;
  m: Messages;
}) {
  const ok = status === "live";
  const text = !hasLink
    ? m.sources.offline
    : ok
      ? m.sourcePage.live
      : `${m.sources.linkStatus[status]}${hasArchive && status !== "corrected" ? ` ${m.sources.archiveKept}` : ""}`;

  return (
    <p className={`flex max-w-[72ch] items-start gap-2.5 self-start rounded-[10px] border px-3.5 py-2.5 text-sm text-ivory ${ok || !hasLink ? "border-sage/60" : "border-sand"}`}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
        <path d={ok || !hasLink ? "M20 6L9 17l-5-5" : WARNING_ICON} />
      </svg>
      <span>
        {text}
        {accessed && hasLink && (
          <span className="text-muted">
            {" "}
            {m.sourcePage.lastChecked}: {accessed}
          </span>
        )}
      </span>
    </p>
  );
}

function LabelCard({ heading, text, children }: { heading: string; text: string; children: ReactNode }) {
  return (
    <div className="card flex flex-col gap-2.5 p-5">
      <span className={EYEBROW}>{heading}</span>
      {children}
      <p className="text-[0.9375rem] text-muted">{text}</p>
    </div>
  );
}

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{term}</dt>
      <dd className="m-0 min-w-0 break-words text-ivory">{children}</dd>
    </>
  );
}

const EXTERNAL_ICON = "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5";
const ARCHIVE_ICON = "M4 7h16v13H4zM3 4h18v3H3zM10 11h4";
const WARNING_ICON = "M12 8v5M12 16h.01M10.3 3.9L2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z";

function ExternalButton({
  href,
  hrefLang,
  primary,
  offSite,
  icon,
  children,
}: {
  href: string;
  hrefLang?: string;
  primary: boolean;
  offSite: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      hrefLang={hrefLang}
      rel="external noopener noreferrer"
      className={`${primary ? "btn-primary" : "btn-ghost"} inline-flex min-h-12 items-center gap-2.5 px-5.5`}
    >
      {children}
      <span className="sr-only"> {offSite}</span>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d={icon} />
      </svg>
    </a>
  );
}
