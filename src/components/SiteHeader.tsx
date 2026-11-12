import { MegaMenu } from "@/components/MegaMenu";
import { LOCALES, LOCALE_LABEL, localeHref, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

/**
 * Site header (ui-inspiration §1, §3, §6): logo · language switcher · Contribute · Menu.
 * Server component; the only client JS is the menu's open/close shell (MegaMenuDialog).
 *
 * - Logo: stacked lockup below md, horizontal from md up (public/brand). Never the badge here.
 * - Language switcher: same page, only the /si /ta /en prefix changes. Pages are static, so the
 *   header can't read the URL itself: pass `path`, the current path without its locale prefix
 *   ("" for home, "/deaths/2024" …). The current language carries aria-current="page".
 * - No animation in the header itself; the menu only moves in the Bright zone (MegaMenuDialog).
 */

type Props = {
  locale: Locale;
  /** Current path without the locale prefix: "" for home, "/deaths", … */
  path: string;
  zone?: "bright" | "quiet";
  /** TODO(contribute): placeholder until the Contribute page exists. */
  contributeHref?: string;
  /** Stick to the top while scrolling (the site default). The preview turns it off. */
  sticky?: boolean;
};

export function SiteHeader({ locale, path, zone = "quiet", contributeHref = "#contribute", sticky = true }: Props) {
  const m = getMessages(locale);

  return (
    <header lang={locale} className={`${sticky ? "sticky top-0 z-10 " : ""}border-b border-sand/20 bg-canopy`}>
      <div className="mx-auto flex max-w-[1240px] items-center gap-1 px-4 py-3 sm:gap-3 md:gap-5 md:px-6">
        <a href={localeHref(locale)} aria-label={m.header.home} className="me-auto shrink-0 no-underline">
          <Logo />
        </a>
        <LanguageSwitcher locale={locale} path={path} label={m.nav.language} />
        {/* Icon-only below sm; below 360px it gives way (Contribute / Correct stays in the menu) */}
        <a
          href={contributeHref}
          className="btn-primary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 max-sm:size-11 max-sm:px-0 max-[22.5rem]:hidden"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[0.9375rem] sr-only md:not-sr-only">{m.nav.contribute}</span>
        </a>
        <MegaMenu locale={locale} zone={zone} />
      </div>
    </header>
  );
}

/** Same page in each language. Labels in their own script; full names for screen readers. */
function LanguageSwitcher({ locale, path, label }: { locale: Locale; path: string; label: string }) {
  return (
    <nav aria-label={label} className="shrink-0">
      <ul className="flex items-center gap-0.5 rounded-full border border-sand/25 p-0.5">
        {LOCALES.map((l) => {
          const current = l === locale;
          return (
            <li key={l}>
              <a
                href={localeHref(l, path)}
                hrefLang={l}
                lang={l}
                aria-label={LOCALE_LABEL[l].name}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-9 min-w-7 items-center justify-center rounded-full px-1 text-sm no-underline sm:min-w-11 sm:px-3 ${
                  current ? "bg-forest font-semibold text-ivory" : "text-muted hover:text-ivory"
                }`}
              >
                {LOCALE_LABEL[l].short}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Logo lockups: stacked below md, horizontal from md up. Never the badge here.
 * public/brand/*.svg are web copies (traced background removed, cropped to the artwork); the
 * untouched originals are in design/brand-source/.
 * <picture> so each visitor downloads one file. Fixed px heights so the logo stays the same size on
 * si/ta pages, where rem is 6% larger: 34px tall ≈ 110px wide, which is what fits at 360px.
 * alt="": the link around it carries the name ("Elephant Archive Sri Lanka, home").
 */
const LOGO = {
  stacked: { src: "/brand/logo-stacked.svg", width: 1086, height: 336 },
  horizontal: { src: "/brand/logo-horizontal.svg", width: 1569, height: 280 },
};

function Logo() {
  return (
    <picture>
      <source media="(min-width: 48rem)" srcSet={LOGO.horizontal.src} width={LOGO.horizontal.width} height={LOGO.horizontal.height} />
      <img
        src={LOGO.stacked.src}
        alt=""
        width={LOGO.stacked.width}
        height={LOGO.stacked.height}
        decoding="async"
        className="block h-[34px] w-auto md:h-[40px]"
      />
    </picture>
  );
}
