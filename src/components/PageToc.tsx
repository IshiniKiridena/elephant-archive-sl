import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

/**
 * In-page table of contents (ui-inspiration §2, §4: record and long-form pages).
 * Server component: plain anchor links, no scroll-spy JS.
 *
 * Below md it collapses into a native <details> "On this page"; from md up it is a plain list.
 * Both copies are rendered and CSS shows exactly one (display:none hides the other from screen
 * readers too), so there is no client JS and no layout shift.
 */

export interface TocSection {
  /** The id of the section heading on the page (link target). */
  id: string;
  title: string;
  /** Language of the title, when it differs from the page (fallback). */
  lang?: Locale;
}

type Props = { locale: Locale; sections: TocSection[] };

export function PageToc({ locale, sections }: Props) {
  if (sections.length === 0) return null;
  const t = getMessages(locale).toc;

  const list = (linkClass: string) => (
    <ol className="flex flex-col">
      {sections.map((s) => (
        <li key={s.id}>
          <a href={`#${encodeURIComponent(s.id)}`} lang={s.lang} className={`flex items-center break-words ${linkClass}`}>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav lang={locale} aria-label={t.onThisPage} className="min-w-0">
      {/* Mobile: collapsed */}
      <details className="group rounded-card border border-sand/20 bg-surface md:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 font-semibold text-ivory group-open:border-b group-open:border-sand/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage [&::-webkit-details-marker]:hidden">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-sand">
            <path d="M5 12h14" />
            <path d="M12 5v14" className="group-open:hidden" />
          </svg>
          {t.onThisPage}
        </summary>
        <div className="px-4 py-2">{list("min-h-11 py-1 text-[0.9375rem]")}</div>
      </details>

      {/* md and up: always visible */}
      <div className="hidden border-s-2 border-sand/30 ps-4 md:block">
        <p className="mb-2 text-xs font-semibold text-sand">{t.onThisPage}</p>
        {list("min-h-8 py-0.5 text-[0.9375rem]")}
      </div>
    </nav>
  );
}
