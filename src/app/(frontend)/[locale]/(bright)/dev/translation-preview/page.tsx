import { notFound } from "next/navigation";
import { LabelChips } from "@/components/LabelChips";
import { ShownInEnglish } from "@/components/i18n/ShownInEnglish";
import { TranslationNote, TranslationReviewed } from "@/components/i18n/TranslationNote";
import { isLocale, localeHref, type Locale } from "@/i18n/config";
import { pageTranslation, pickLocalized, type Localized, type TranslationReview } from "@/i18n/fallback";
import { getMessages } from "@/i18n/get-messages";

/**
 * DEV ONLY: preview of the three translation states from the design, using fake placeholder
 * content in the shape Payload returns with `locale: "all"`. 404 in production builds.
 *   /si/dev/translation-preview?state=partial | missing | approved
 */

const STATES = ["partial", "missing", "approved"] as const;
type State = (typeof STATES)[number];
const PATH = "/dev/translation-preview";

/** Clearly fake: bracketed English placeholders, never real Sinhala or Tamil content. */
const placeholder = (what: string): Localized<string> => ({
  en: `[Example ${what}]`,
  si: `[Example ${what} · Sinhala placeholder]`,
  ta: `[Example ${what} · Tamil placeholder]`,
});

function exampleDoc(state: State) {
  const doc = {
    title: placeholder("chapter title"),
    intro: placeholder("chapter introduction"),
    figureLabel: placeholder("figure label"),
    s1Title: placeholder("section heading"),
    s1Body: placeholder("section text"),
    s2Title: placeholder("second section heading"),
    s2Body: placeholder("second section text"),
  };
  // partial: approved, but section 2 has no si/ta text yet
  if (state === "partial") {
    doc.s2Title = { en: doc.s2Title?.en };
    doc.s2Body = { en: doc.s2Body?.en };
  }
  // missing: si/ta text exists but is still under review, so it is not shown
  const review: TranslationReview =
    state === "missing" ? { si: "needs_review", ta: "needs_review" } : { si: "approved", ta: "approved" };
  return { doc, review };
}

export default async function TranslationPreview({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const requested = (await searchParams).state;
  const state: State = STATES.find((s) => s === requested) ?? "partial";

  const t = getMessages(locale);
  const { doc, review } = exampleDoc(state);
  const pick = (f: Localized<string>) => pickLocalized(f, locale, review);

  const title = pick(doc.title);
  const intro = pick(doc.intro);
  const figureLabel = pick(doc.figureLabel);
  const s1 = { title: pick(doc.s1Title), body: pick(doc.s1Body) };
  const s2 = { title: pick(doc.s2Title), body: pick(doc.s2Body) };
  const pageState = pageTranslation([title, intro, figureLabel, s1.title, s1.body, s2.title, s2.body], locale);
  // Whole-page fallback is explained by the note; chips mark single blocks only
  const chip = (fellBack: boolean) => (
    <ShownInEnglish show={fellBack && pageState === "partial"} locale={locale} label={t.translation.shownInEnglish} />
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-7 px-4 pb-24 pt-7">
      <DevBar locale={locale} state={state} />

      <TranslationNote locale={locale} state={pageState} t={t.translation} englishHref={localeHref("en", PATH) + `?state=${state}`} />

      <article className="flex max-w-4xl flex-col gap-7">
        <header className="flex flex-col gap-3">
          {chip(title.fellBack || intro.fellBack)}
          <h1 lang={title.lang} className="text-3xl font-bold leading-tight text-ivory md:text-5xl">
            {title.value}
          </h1>
          <p lang={intro.lang} className="prose-measure text-lg text-muted">
            {intro.value}
          </p>
        </header>

        <div className="card flex max-w-sm flex-col gap-1.5 p-5">
          <span lang={figureLabel.lang} className="text-sm text-muted">
            {figureLabel.value}
          </span>
          <span className="text-4xl font-extrabold leading-none text-ivory">[Figure]</span>
          <LabelChips sourceType="academic" verification="multiple_outlets" t={t.evidence} />
        </div>

        {[s1, s2].map((s, i) => (
          <section key={i} className="flex flex-col gap-2.5">
            {chip(s.title.fellBack || s.body.fellBack)}
            <h2 lang={s.title.lang} className="text-2xl font-bold text-ivory">
              {s.title.value}
            </h2>
            <p lang={s.body.lang} className="prose-measure text-ivory">
              {s.body.value}
            </p>
          </section>
        ))}

        <TranslationReviewed locale={locale} state={pageState} t={t.translation} />
      </article>
    </main>
  );
}

function DevBar({ locale, state }: { locale: Locale; state: State }) {
  return (
    <div lang="en" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-dashed border-sand/50 px-3.5 py-2.5 text-sm text-sand">
      <span className="font-semibold">Dev preview, fake content.</span>
      <span>State:</span>
      {STATES.map((s) => (
        <a key={s} href={`${localeHref(locale, PATH)}?state=${s}`} aria-current={s === state ? "page" : undefined} className={s === state ? "font-semibold text-ivory" : ""}>
          {s}
        </a>
      ))}
      <span aria-hidden="true">·</span>
      <span>Language:</span>
      {(["si", "ta", "en"] as const).map((l) => (
        <a key={l} href={`${localeHref(l, PATH)}?state=${state}`} aria-current={l === locale ? "page" : undefined} className={l === locale ? "font-semibold text-ivory" : ""}>
          {l}
        </a>
      ))}
    </div>
  );
}
