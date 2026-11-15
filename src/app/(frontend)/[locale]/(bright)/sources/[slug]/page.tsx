import config from "@payload-config";
import type { Metadata } from "next";
import { draftMode, headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { SourceDetail } from "@/components/sources/SourceDetail";
import { LOCALES, isLocale, localeHref } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { citingRecords, getSourceForPage, publishedSourceSlugs } from "@/lib/sources/get-source";

/**
 * Public page for one source: /si|ta|en/sources/<slug>.
 * Static: built for every published source, and rebuilt on demand when one is published, changed
 * or unpublished (revalidateOnPublish on Sources). A source published after the build renders on
 * its first visit and is then cached (dynamicParams stays on).
 * Drafts only in draft preview with a staff login; headers() is read only then, so the normal
 * render stays static.
 */

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const payload = await getPayload({ config });
  return (await publishedSourceSlugs(payload)).map((slug) => ({ slug }));
}

/** One lookup per request, shared by generateMetadata and the page. */
const loadSource = cache(async (slug: string) => {
  const { isEnabled } = await draftMode();
  const payload = await getPayload({ config });
  const user = isEnabled ? (await payload.auth({ headers: await headers() })).user : null;
  return { source: await getSourceForPage(payload, slug, { draft: isEnabled, user }), payload, preview: isEnabled };
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { source, preview } = await loadSource(slug);
  if (!source) return {};
  const path = `/sources/${source.slug}`;
  return {
    title: source.title,
    description: [getMessages(locale).sourcePage.eyebrow, source.publisher].filter(Boolean).join(" · "),
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, localeHref(l, path)])) },
    ...(preview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function SourcePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const { source, payload } = await loadSource(slug);
  if (!source) notFound();
  const path = `/sources/${source.slug}`;
  const records = await citingRecords(payload, source.id, locale);

  return (
    <>
      <SiteHeader locale={locale} path={path} zone="bright" />
      <main>
        <SourceDetail source={source} locale={locale} records={records} />
      </main>
      <Footer locale={locale} path={path} />
    </>
  );
}
