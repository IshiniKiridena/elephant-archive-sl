import type { Locale } from "@/i18n/config";

/**
 * Chip above a content block that fell back to English on a si/ta page.
 * The chip is in the page's language; the block below it carries lang="en".
 */
export function ShownInEnglish({ show, locale, label }: { show: boolean; locale: Locale; label: string }) {
  if (!show || locale === "en") return null;
  return (
    <span lang={locale} className="inline-flex items-center gap-1.5 self-start rounded-full border border-sand/50 px-2.5 py-px text-xs text-sand">
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </svg>
      {label}
    </span>
  );
}
