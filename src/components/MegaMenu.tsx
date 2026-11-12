import { MegaMenuDialog } from "@/components/MegaMenuDialog";
import { localeHref, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import type { Messages } from "@/i18n/messages/en";

/**
 * Site menu (ui-inspiration §2: six-plus topic sections, each with a one-line description, and a
 * short secondary list). Server component: all links and text render on the server; only the
 * open/close shell (MegaMenuDialog) is client JS.
 *
 * Paths are the planned section routes; pages that don't exist yet will 404 until they are built.
 * Quiet sections must match QUIET_SECTIONS in src/lib/motion-zone.ts ("deaths", "court-cases").
 */

type SectionKey = keyof Messages["menu"]["sections"];
type SecondaryKey = keyof Messages["menu"]["secondary"];

export const MENU_SECTIONS: { key: SectionKey; path: string }[] = [
  { key: "elephants", path: "/elephants" },
  { key: "deaths", path: "/deaths" },
  { key: "rescues", path: "/rescues" },
  { key: "courtCases", path: "/court-cases" },
  { key: "governmentActions", path: "/government-actions" },
  { key: "history", path: "/history" },
  { key: "communityStories", path: "/community-stories" },
];

export const MENU_SECONDARY: { key: SecondaryKey; path: string }[] = [
  { key: "sources", path: "/sources" },
  { key: "methodology", path: "/methodology" },
  { key: "contribute", path: "/contribute" },
  { key: "about", path: "/about" },
  { key: "contact", path: "/contact" },
];

export function MegaMenu({ locale, zone = "quiet" }: { locale: Locale; zone?: "bright" | "quiet" }) {
  const m = getMessages(locale);
  const t = m.menu;

  return (
    <MegaMenuDialog openLabel={m.nav.menu} closeLabel={t.close} lang={locale} zone={zone}>
      <nav aria-label={t.sectionsLabel}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MENU_SECTIONS.map(({ key, path }) => (
            <li key={key} className="min-w-0">
              <a
                href={localeHref(locale, path)}
                className="flex h-full min-w-0 flex-col gap-1 rounded-card border border-sand/20 bg-surface p-4 no-underline hover:border-sage"
              >
                {/* Explicit rem sizes: the si/ta em bump in globals.css would otherwise compound here */}
                <span className="text-base font-semibold break-words text-ivory">{t.sections[key].title}</span>
                <span className="text-sm break-words text-muted">{t.sections[key].description}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label={t.moreHeading} className="flex flex-col gap-2 border-t border-sand/20 pt-4">
        <h3 className="text-xs font-semibold text-sand">
          {t.moreHeading}
        </h3>
        <ul className="flex flex-wrap gap-x-5">
          {MENU_SECONDARY.map(({ key, path }) => (
            <li key={key}>
              <a href={localeHref(locale, path)} className="inline-flex min-h-11 items-center text-[0.9375rem] break-words">
                {t.secondary[key]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </MegaMenuDialog>
  );
}
