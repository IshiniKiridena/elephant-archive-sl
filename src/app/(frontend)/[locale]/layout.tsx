import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Noto_Sans, Noto_Sans_Sinhala, Noto_Sans_Tamil } from "next/font/google";
import type { ReactNode } from "react";
import { LOCALES, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PurposeStatement } from "@/components/advocacy/PurposeStatement";
import "@/styles/globals.css";
import "@/styles/advocacy.css";

/*
 * Root layout for the public site. Static: no headers() or cookies() here.
 * Fonts are self-hosted by next/font at build time (no request to Google from visitors).
 * Sinhala/Tamil load only the glyph subsets they need; `display: swap` keeps text visible.
 */
const latin = Noto_Sans({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const sinhala = Noto_Sans_Sinhala({ subsets: ["sinhala"], variable: "--font-sinhala", display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-tamil", display: "swap", preload: false });

export const dynamicParams = false; // only /si, /ta, /en exist
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: { default: t.siteName, template: `%s · ${t.siteName}` },
    description: t.tagline,
    alternates: { languages: { si: "/si", ta: "/ta", en: "/en" } },
  };
}

/* Sets <html data-saver="1"> before paint when the browser's data-saver is on (Chrome/Android). */
const SAVE_DATA_SCRIPT = `try{if(navigator.connection&&navigator.connection.saveData)document.documentElement.dataset.saver="1"}catch(e){}`;

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <html lang={locale} className={`${latin.variable} ${sinhala.variable} ${tamil.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SAVE_DATA_SCRIPT }} />
      </head>
      <body>
        {/* SiteHeader (logo · language switcher · Contribute · Menu) arrives with the base components step */}
        {children}
        <footer className="mt-16 bg-umber px-4 py-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <PurposeStatement locale={locale} variant="short" />
            <p className="text-sm text-muted">{t.footer.legal}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
