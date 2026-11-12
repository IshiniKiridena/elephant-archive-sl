import { notFound } from "next/navigation";
import { isLocale, localeHref } from "@/i18n/config";
import { pageTranslation } from "@/i18n/fallback";
import { getMessages } from "@/i18n/get-messages";
import { ElephantWalk } from "@/components/advocacy/ElephantWalk";
import { PurposeStatement, purposeLang } from "@/components/advocacy/PurposeStatement";
import { TranslationNote } from "@/components/i18n/TranslationNote";

/**
 * Starter home (Phase 0). Real sections from docs/design/advocacy-engagement.md §6 arrive in Phase 1.
 * No facts or figures appear here until they come through the pipeline with labels.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  // Hero copy is UI text (always translated). The purpose statement is content and may fall back.
  const state = pageTranslation([{ fellBack: false }, { fellBack: purposeLang(locale) !== locale }], locale);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-sand/20 px-4 pb-6 pt-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <TranslationNote locale={locale} state={state} t={t.translation} englishHref={localeHref("en")} />
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-sand">{t.siteName}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ivory md:text-6xl">{t.home.heroTitle}</h1>
          <p className="prose-measure mt-4 text-lg text-muted">{t.home.heroBody}</p>
          <a href={localeHref(locale)} className="btn-primary mt-8 inline-block">
            {t.home.heroCta}
          </a>
        </div>
        <div className="mx-auto mt-10 max-w-5xl">
          <ElephantWalk pauseLabel={t.herd.pause} playLabel={t.herd.play} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <PurposeStatement locale={locale} variant="full" shownInEnglish={t.translation.shownInEnglish} />
      </section>
    </main>
  );
}
