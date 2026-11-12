import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DataLimits, type DataLimitItem } from "@/components/DataLimits";
import { Footer } from "@/components/Footer";
import { LabelChips } from "@/components/LabelChips";
import { LegalNotice } from "@/components/LegalNotice";
import { PageToc } from "@/components/PageToc";
import { ReadMore } from "@/components/ReadMore";
import { SiteHeader } from "@/components/SiteHeader";
import { SourcesPanel, type SourceCitation } from "@/components/SourcesPanel";
import { LOCALES, LOCALE_LABEL, isLocale, type Locale } from "@/i18n/config";
import { SOURCE_TYPES, VERIFICATION_STATUSES } from "@/lib/evidence-labels";

/** Clearly fake sources (example.org only, bracketed placeholders). Never real outlets or figures. */
const EXAMPLE_CONFLICT: SourceCitation[] = [
  {
    source: {
      id: 1,
      title: "[Example article title]",
      publisher: "Example News",
      date: "2024-03-10",
      url: "https://example.org/example-article",
      archiveUrl: "https://archive.example.org/example-article",
      language: "en",
      sourceType: "news",
      verificationStatus: "single_source",
      linkStatus: "live",
    },
    figure: { value: "[Figure A]", counts: "[What it counts]" },
    quote: "[Example quote, under fifteen words]",
  },
  {
    source: {
      id: 2,
      title: "[Example annual report title]",
      publisher: "Example Department",
      date: "2024-03",
      url: null,
      archiveUrl: null,
      language: "en",
      sourceType: "official",
      verificationStatus: "verified",
      linkStatus: null,
    },
    figure: { value: "[Figure B]", counts: "[What it counts]" },
    // 20 words: dropped by the panel, never shown or trimmed
    quote: "[example] one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen",
  },
];

/** Clearly fake limits: bracketed placeholders only, no real gaps, causes or figures. */
const EXAMPLE_LIMITS_FEW: DataLimitItem[] = [
  {
    kind: "gap",
    title: "[Example gap in the records]",
    explanation: "[Example explanation of which records may be missing, and why they are hard to count.]",
  },
  {
    kind: "unconfirmed",
    title: "[Example cause shown as reported]",
    explanation: "[Example explanation that a cause is confirmed only when a post-mortem result is published.]",
  },
  {
    kind: "conflict",
    title: "[Example yearly total that sources disagree on]",
    explanation: "[Example explanation of why two sources give different totals for the same year.]",
    figures: [
      { value: "[Figure A]", source: "Example Department", date: "2024-01" },
      { value: "[Figure B]", source: "Example News", date: "2024-03-10" },
    ],
  },
];

const EXAMPLE_LIMITS_MANY: DataLimitItem[] = [
  ...EXAMPLE_LIMITS_FEW,
  {
    kind: "gap",
    title: "[Example: older years are less complete]",
    explanation:
      "[Example longer explanation. It describes, in calm and plain words, why records from earlier years are less complete than recent ones, what kinds of events are most likely to be missing, and how readers should take that into account when comparing years.]",
  },
  {
    kind: "gap",
    title: "[Example: places recorded by district only]",
    explanation: "[Example explanation that places are recorded by district only, and only for past events.]",
  },
];

const EXAMPLE_LINK_STATES: SourceCitation[] = [
  {
    source: {
      id: 3,
      title: "[Example post title, removed by its publisher]",
      publisher: "Example Community Group",
      date: "2023",
      url: "https://example.org/removed-post",
      archiveUrl: "https://archive.example.org/removed-post",
      language: "en",
      sourceType: "organisation",
      verificationStatus: "disputed",
      linkStatus: "removed",
    },
  },
  {
    source: {
      id: 4,
      title: "[Example page title, corrected since we cited it]",
      publisher: "Example News",
      date: "2022-11-05",
      url: "https://example.org/corrected-page",
      archiveUrl: "https://archive.example.org/corrected-page",
      language: "en",
      sourceType: "news",
      verificationStatus: "multiple_outlets",
      linkStatus: "corrected",
    },
  },
  {
    source: {
      id: 5,
      title: "[Example page title, unreachable, no archived copy]",
      publisher: "Example Social Account",
      date: null,
      url: "https://example.org/unreachable-page",
      archiveUrl: null,
      language: "other",
      sourceType: "social_media",
      verificationStatus: "unverified",
      linkStatus: "unreachable",
    },
  },
];

/**
 * DEV ONLY: component preview at /[locale]/_components (folder is %5Fcomponents because
 * "_" folders are private in the App Router). 404 in production builds, never indexed.
 * Shows each component in si / ta / en, in the Bright and the Quiet zone.
 */

export const metadata: Metadata = {
  title: "Component preview",
  robots: { index: false, follow: false },
};

export default async function ComponentPreview({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main lang="en" className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-24 pt-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-ivory">Component preview</h1>
        <p className="text-sm text-sand">Dev only. Not in production builds, not indexed. All example data is fake.</p>
        <nav aria-label="Components" className="flex flex-wrap gap-x-4 text-sm">
          <a href="#header-bright">SiteHeader + MegaMenu</a>
          <a href="#footer-bright">Footer</a>
          <a href="#bright-zone">LabelChips</a>
          <a href="#sources-bright">SourcesPanel</a>
          <a href="#quiet-zone">Quiet zone</a>
          <a href="#data-limits">DataLimits</a>
          <a href="#legal-notice">LegalNotice</a>
          <a href="#toc-bright">PageToc + ReadMore (Bright)</a>
          <a href="#toc-quiet">PageToc + ReadMore (Quiet)</a>
        </nav>
      </header>

      <section aria-labelledby="header-bright" className="flex flex-col gap-6">
        <h2 id="header-bright" className="text-2xl font-bold text-ivory">
          SiteHeader + MegaMenu · Bright zone
        </h2>
        <p className="text-sm text-muted">
          Language links stay on this page. Menu opens with a 200 ms fade unless reduced motion is on. Logo is a placeholder.
        </p>
        {LOCALES.map((l) => (
          <HeaderSet key={l} locale={l} zone="bright" />
        ))}
      </section>

      <section aria-labelledby="footer-bright" className="flex flex-col gap-6">
        <h2 id="footer-bright" className="text-2xl font-bold text-ivory">
          Footer · Bright zone
        </h2>
        <p className="text-sm text-muted">No animation in either zone. Language links stay on this page.</p>
        {LOCALES.map((l) => (
          <FooterSet key={l} locale={l} zone="bright" />
        ))}
      </section>

      <section aria-labelledby="bright-zone" className="flex flex-col gap-6">
        <h2 id="bright-zone" className="text-2xl font-bold text-ivory">
          LabelChips · Bright zone
        </h2>
        {LOCALES.map((l) => (
          <ChipSet key={l} locale={l} />
        ))}
      </section>

      <section aria-labelledby="sources-bright" className="flex flex-col gap-6">
        <h2 id="sources-bright" className="text-2xl font-bold text-ivory">
          SourcesPanel · Bright zone
        </h2>
        {LOCALES.map((l) => (
          <SourcesSet key={l} locale={l} zone="bright" />
        ))}
      </section>

      <section aria-labelledby="toc-bright" className="flex flex-col gap-6">
        <h2 id="toc-bright" className="text-2xl font-bold text-ivory">
          PageToc + ReadMore · Bright zone
        </h2>
        <p className="text-sm text-muted">Read more fades in (200 ms) unless reduced motion is on.</p>
        {LOCALES.map((l) => (
          <TocSet key={l} locale={l} zone="bright" />
        ))}
      </section>

      {/* Same wrapper as the (quiet) route group: no motion inside */}
      <div data-zone="quiet" className="flex flex-col gap-6">
        <h2 id="header-quiet" className="text-2xl font-bold text-ivory">
          SiteHeader + MegaMenu · Quiet zone
        </h2>
        <p className="text-sm text-muted">Menu opens and closes with no motion.</p>
        {LOCALES.map((l) => (
          <HeaderSet key={l} locale={l} zone="quiet" />
        ))}

        <h2 id="footer-quiet" className="text-2xl font-bold text-ivory">
          Footer · Quiet zone
        </h2>
        {LOCALES.map((l) => (
          <FooterSet key={l} locale={l} zone="quiet" />
        ))}

        <header className="band-sensitive flex flex-col gap-3 rounded-card px-4 py-6">
          <h2 id="quiet-zone" className="text-2xl font-bold text-ivory">
            LabelChips · Quiet zone
          </h2>
          <p className="text-sm text-muted">On the Umber band, as on a Deaths or Court Cases page header:</p>
          {LOCALES.map((l) => (
            <LabelChips key={l} locale={l} sourceType="court_record" verification="disputed" />
          ))}
        </header>
        {LOCALES.map((l) => (
          <ChipSet key={l} locale={l} />
        ))}
        <h2 className="text-2xl font-bold text-ivory">SourcesPanel · Quiet zone</h2>
        {LOCALES.map((l) => (
          <SourcesSet key={l} locale={l} zone="quiet" />
        ))}

        <h2 id="data-limits" className="text-2xl font-bold text-ivory">
          DataLimits · Quiet zone only
        </h2>
        {LOCALES.map((l) => (
          <div key={l} className="flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-sand">
              <span lang={l}>{LOCALE_LABEL[l].name}</span> ({l})
            </h3>
            <p className="text-xs uppercase tracking-wider text-muted">3 items: explanations open</p>
            <DataLimits locale={l} items={EXAMPLE_LIMITS_FEW} lastChecked="2024-05" methodHref="#data-limits" correctionHref="#data-limits" headingLevel={3} id={`limits-${l}-few`} />
            <p className="text-xs uppercase tracking-wider text-muted">5 items: explanations behind Read more; one item in English (fallback)</p>
            <DataLimits
              locale={l}
              items={EXAMPLE_LIMITS_MANY.map((it, i) => (i === 4 && l !== "en" ? { ...it, lang: "en" as const } : it))}
              lastChecked="2024-05-20"
              headingLevel={3}
              id={`limits-${l}-many`}
            />
          </div>
        ))}

        <h2 id="toc-quiet" className="text-2xl font-bold text-ivory">
          PageToc + ReadMore · Quiet zone
        </h2>
        <p className="text-sm text-muted">Read more changes colour only. Nothing moves.</p>
        {LOCALES.map((l) => (
          <TocSet key={l} locale={l} zone="quiet" />
        ))}

        <h2 id="legal-notice" className="text-2xl font-bold text-ivory">
          LegalNotice · Quiet zone
        </h2>
        {LOCALES.map((l) => (
          <div key={l} id={`legal-${l}`} className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-sand">
              <span lang={l}>{LOCALE_LABEL[l].name}</span> ({l})
            </h3>
            <p className="text-xs uppercase tracking-wider text-muted">deaths · on the Umber band, as in the Deaths page header</p>
            <div className="band-sensitive rounded-card px-4 py-5">
              <LegalNotice locale={l} variant="deaths" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted">court · court case page</p>
            <LegalNotice locale={l} variant="court" />
            <p className="text-xs uppercase tracking-wider text-muted">short · footer line</p>
            <div className="rounded-card border-t border-sand/15 bg-umber px-4 py-4">
              <LegalNotice locale={l} variant="short" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/**
 * The header as a page would render it: full width (cancels main's px-4, so 360px here means 360px
 * on a real page), not sticky so several can sit on one page.
 */
function HeaderSet({ locale, zone }: { locale: Locale; zone: "bright" | "quiet" }) {
  return (
    <div id={`header-${zone}-${locale}`} className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-sand">
        <span lang={locale}>{LOCALE_LABEL[locale].name}</span> ({locale})
      </h3>
      <div className="-mx-4 border-t border-sand/20">
        <SiteHeader locale={locale} path="/_components" zone={zone} sticky={false} />
      </div>
    </div>
  );
}

/** The footer as a page would render it: full width, like the header preview. */
function FooterSet({ locale, zone }: { locale: Locale; zone: "bright" | "quiet" }) {
  return (
    <div id={`footer-${zone}-${locale}`} className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-sand">
        <span lang={locale}>{LOCALE_LABEL[locale].name}</span> ({locale})
      </h3>
      <div className="-mx-4">
        <Footer locale={locale} path="/_components" />
      </div>
    </div>
  );
}

/** A fake long-form page: table of contents, then three sections whose long text sits behind Read more. */
function TocSet({ locale, zone }: { locale: Locale; zone: "bright" | "quiet" }) {
  const sections = [1, 2, 3].map((n) => ({ id: `${zone}-${locale}-example-${n}`, title: `[Example section ${n} heading]` }));
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-sand">
        <span lang={locale}>{LOCALE_LABEL[locale].name}</span> ({locale})
      </h3>
      <PageToc locale={locale} sections={sections} />
      {sections.map((s) => (
        <section key={s.id} aria-labelledby={s.id} className="flex flex-col gap-2">
          <h4 id={s.id} className="text-xl font-bold text-ivory">
            {s.title}
          </h4>
          <p className="prose-measure text-ivory">[Example opening paragraph, always visible.]</p>
          <ReadMore locale={locale} zone={zone} label={s.title}>
            <p className="prose-measure text-muted">
              [Example longer text that stays folded until the reader asks for it. It is placeholder text only, standing in for a
              long section of a record or life story.]
            </p>
          </ReadMore>
        </section>
      ))}
    </div>
  );
}

/** Conflicting figures (with one over-long quote that must not appear), then every link state. */
function SourcesSet({ locale, zone }: { locale: Locale; zone: "bright" | "quiet" }) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-sand">
        <span lang={locale}>{LOCALE_LABEL[locale].name}</span> ({locale})
      </h3>
      <SourcesPanel locale={locale} citations={EXAMPLE_CONFLICT} headingLevel={3} id={`src-${zone}-${locale}-a`} />
      <SourcesPanel locale={locale} citations={EXAMPLE_LINK_STATES} headingLevel={3} id={`src-${zone}-${locale}-b`} />
    </div>
  );
}

/** Every value alone, then the pairs a page shows, in both sizes, on canopy and on a card. */
function ChipSet({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-sand">
        <span lang={locale}>{LOCALE_LABEL[locale].name}</span> ({locale})
      </h3>

      <Row label="Each source type">
        {SOURCE_TYPES.map((st) => (
          <LabelChips key={st} locale={locale} sourceType={st} />
        ))}
      </Row>
      <Row label="Each verification status">
        {VERIFICATION_STATUSES.map((v) => (
          <LabelChips key={v} locale={locale} verification={v} />
        ))}
      </Row>

      <div className="card flex flex-col gap-4 p-5">
        <Row label="Title block (md) on a card">
          <LabelChips locale={locale} sourceType="news" verification="single_source" />
          <LabelChips locale={locale} sourceType="unverified" verification="multiple_outlets" />
        </Row>
        <Row label="List row (sm) on a card">
          <LabelChips size="sm" locale={locale} sourceType="court_record" verification="verified" />
          <LabelChips size="sm" locale={locale} sourceType="social_media" verification="disputed" />
          <LabelChips size="sm" locale={locale} sourceType="organisation" verification="unverified" />
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}
