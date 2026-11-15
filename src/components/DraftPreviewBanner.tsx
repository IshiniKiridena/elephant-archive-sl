import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

/**
 * Shown at the top of every public page while draft preview is on (staff only, see lib/preview.ts).
 * Server component, no motion: safe in Quiet pages. Words, not colour alone, say it's a preview.
 */
export function DraftPreviewBanner({ locale }: { locale: Locale }) {
  const t = getMessages(locale).preview;
  return (
    <div role="status" lang={locale} className="border-b border-sand bg-surface">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm md:px-6">
        <span className="rounded-full border border-sand px-2.5 py-px font-semibold text-sand">{t.banner}</span>
        <span className="min-w-0 flex-[1_1_16rem] text-ivory">{t.body}</span>
        {/* Plain <a>, not <Link>: a prefetch of this route would turn preview off */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler with a side effect, must never be prefetched */}
        <a href="/next/exit-preview" className="inline-flex min-h-11 items-center font-semibold">
          {t.exit}
        </a>
      </div>
    </div>
  );
}
