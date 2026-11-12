import { LegalNotice } from "@/components/LegalNotice";
import { MENU_SECONDARY } from "@/components/MegaMenu";
import { PurposeStatement } from "@/components/advocacy/PurposeStatement";
import { LOCALES, LOCALE_LABEL, localeHref, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

/**
 * Site footer (design: Home page footer; ui-inspiration §2, §5). Server component, no client JS,
 * no animation in either zone: hover changes colour only.
 *
 * - Umber background: Umber is the footer's brand colour (palette rule 5).
 * - Horizontal logo, never the badge (the badge appears in the design here; the logo rule wins).
 * - Purpose line: PurposeStatement "short" (advocacy-engagement §0). Its si/ta text is not written
 *   yet on purpose, so it shows in English with a "Shown in English" chip until approved.
 * - Legal line: LegalNotice "short". Links: MENU_SECONDARY, shared with the menu.
 * - Language links: same page in each language, like the header. Pass `path` (no locale prefix).
 */

const LOGO = { src: "/brand/logo-horizontal.svg", width: 1569, height: 280 };

export function Footer({ locale, path }: { locale: Locale; path: string }) {
  const m = getMessages(locale);

  return (
    <footer lang={locale} className="border-t border-sand/20 bg-umber">
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-10 gap-y-8 px-4 pb-8 pt-12 md:px-6">
        <div className="flex min-w-0 flex-[1_1_17.5rem] flex-col gap-3.5">
          {/* Fixed px height: same size on si/ta pages, where rem is 6% larger */}
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG; no Vercel image optimisation (CLAUDE.md) */}
          <img src={LOGO.src} alt={m.siteName} width={LOGO.width} height={LOGO.height} loading="lazy" decoding="async" className="block h-[36px] w-auto self-start" />
          <div className="max-w-[36ch]">
            <PurposeStatement locale={locale} variant="short" shownInEnglish={m.translation.shownInEnglish} />
          </div>
        </div>

        <nav aria-label={m.footer.linksLabel} className="min-w-0 flex-[2_1_20rem]">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-6">
            {MENU_SECONDARY.map(({ key, path: p }) => (
              <li key={key}>
                <a href={localeHref(locale, p)} className="inline-flex min-h-11 items-center text-[0.9375rem] break-words text-ivory no-underline hover:text-sand">
                  {m.menu.secondary[key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-sand/15 px-4 pb-8 pt-4 md:px-6">
        <LegalNotice locale={locale} variant="short" />
        <nav aria-label={m.nav.language}>
          <ul className="flex flex-wrap gap-x-4">
            {LOCALES.map((l) => (
              <li key={l}>
                <a
                  href={localeHref(l, path)}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === locale ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center text-[0.8125rem] ${l === locale ? "font-semibold text-ivory no-underline" : "text-muted hover:text-ivory"}`}
                >
                  {LOCALE_LABEL[l].name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
