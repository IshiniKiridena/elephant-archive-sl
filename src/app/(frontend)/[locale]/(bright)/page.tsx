import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary, hasOwnText } from "@/i18n/dictionaries";
import { ElephantWalk } from "@/components/advocacy/ElephantWalk";
import { PurposeStatement } from "@/components/advocacy/PurposeStatement";

/**
 * Starter home (Phase 0). Real sections from docs/design/advocacy-engagement.md §6 arrive in Phase 1.
 * No facts or figures appear here until they come through the pipeline with labels.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const textLang = hasOwnText(locale, "home") ? locale : "en";

  return (
    <main>
      <section className="relative overflow-hidden border-b border-sand/20 px-4 pb-6 pt-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm uppercase tracking-[0.2em] text-sand">{t.siteName}</p>
          <h1 lang={textLang} className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ivory md:text-6xl">
            {t.home.heroTitle}
          </h1>
          <p lang={textLang} className="prose-measure mt-4 text-lg text-muted">
            {t.home.heroBody}
          </p>
          <a href={`/${locale}`} className="btn-primary mt-8 inline-block">
            {t.home.heroCta}
          </a>
        </div>
        <div className="mx-auto mt-10 max-w-5xl">
          <ElephantWalk pauseLabel={t.herd.pause} playLabel={t.herd.play} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <PurposeStatement locale={locale} variant="full" />
      </section>
    </main>
  );
}
