import { localeHref, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { en } from "@/i18n/messages/en";

/**
 * The site logo, linked to the home page in the current language (design/logos.md).
 * - "header": two-line lockup below md, horizontal from md up, via <picture> so each visitor
 *   downloads one file. Never the badge: the badge is for app icons only.
 * - "footer": horizontal lockup.
 * Static SVGs from public/brand, served as is (no Vercel image optimisation, CLAUDE.md).
 * Logos never animate: [data-logo] turns off animation, transitions and transforms in globals.css,
 * in both zones. Fixed px heights keep the logo the same size on si/ta pages, where rem is 6% larger.
 */

export const LOGOS = {
  stacked: { src: "/brand/logo-stacked.svg", width: 1086, height: 336 },
  horizontal: { src: "/brand/logo-horizontal.svg", width: 1569, height: 280 },
} as const;

type Props = { locale: Locale; variant: "header" | "footer"; className?: string };

export function BrandLogo({ locale, variant, className = "" }: Props) {
  const alt = getMessages(locale).brand.logoAlt;
  // The logo's words are English; until a reviewed si/ta form replaces them, say so to screen readers
  const lang = alt === en.brand.logoAlt ? "en" : undefined;

  return (
    <a href={localeHref(locale)} data-logo="" className={`inline-block shrink-0 no-underline ${className}`}>
      {variant === "header" ? (
        <picture>
          <source media="(min-width: 48rem)" srcSet={LOGOS.horizontal.src} width={LOGOS.horizontal.width} height={LOGOS.horizontal.height} />
          <img
            src={LOGOS.stacked.src}
            alt={alt}
            lang={lang}
            width={LOGOS.stacked.width}
            height={LOGOS.stacked.height}
            decoding="async"
            className="block h-[34px] w-auto md:h-[40px]"
          />
        </picture>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- static SVG; no Vercel image optimisation (CLAUDE.md)
        <img
          src={LOGOS.horizontal.src}
          alt={alt}
          lang={lang}
          width={LOGOS.horizontal.width}
          height={LOGOS.horizontal.height}
          loading="lazy"
          decoding="async"
          className="block h-[36px] w-auto"
        />
      )}
    </a>
  );
}
