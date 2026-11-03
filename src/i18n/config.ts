export const LOCALES = ["si", "ta", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (v: string | undefined): v is Locale => !!v && (LOCALES as readonly string[]).includes(v);

/** Labels for the switcher, each in its own script. */
export const LOCALE_LABEL: Record<Locale, { short: string; name: string }> = {
  si: { short: "සිං", name: "සිංහල" },
  ta: { short: "த", name: "தமிழ்" },
  en: { short: "EN", name: "English" },
};

/** Pick a locale from Accept-Language: Sinhala or Tamil if the browser asks for them, else English. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const tags = acceptLanguage
    .split(",")
    .map((p) => {
      const [tag, q] = p.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
