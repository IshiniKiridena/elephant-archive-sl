import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

/**
 * Legal notice (content rule 4; design: Deaths page header). Required on every court case page.
 * Quiet zone: server component, no client JS, no animation or transforms, no warning or alarm
 * icons. A calm bordered note with a static shield mark, as in the design.
 *
 * - deaths: Deaths dashboard and death records
 * - court:  court case pages (presumption of innocence)
 * - short:  footer line, plain text
 * All wording lives in the message files and is awaiting lawyer review there.
 */

export const LEGAL_NOTICE_VARIANTS = ["deaths", "court", "short"] as const;
export type LegalNoticeVariant = (typeof LEGAL_NOTICE_VARIANTS)[number];

export function LegalNotice({ locale, variant }: { locale: Locale; variant: LegalNoticeVariant }) {
  const t = getMessages(locale).legalNotice;

  if (variant === "short") {
    return (
      <p lang={locale} className="text-[0.8125rem] break-words text-muted">
        {t.short}
      </p>
    );
  }

  return (
    <div
      role="note"
      aria-label={t.label}
      lang={locale}
      className="flex max-w-[55rem] min-w-0 items-start gap-3 rounded-card border border-sand/35 bg-canopy px-4 py-3.5 text-sm text-ivory"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-sand">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
      </svg>
      <p className="min-w-0 break-words">{t[variant]}</p>
    </div>
  );
}
