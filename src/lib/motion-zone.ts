/**
 * Bright vs Quiet zones (docs/design/advocacy-engagement.md §2).
 * Quiet pages live under src/app/(frontend)/[locale]/(quiet)/, whose layout wraps them in
 * <div data-zone="quiet">; advocacy.css then turns off all motion inside it.
 * This list is the single source of truth for which sections are Quiet: keep the route group in sync.
 */
export const QUIET_SECTIONS = ["deaths", "causes", "court-cases", "remembered", "data-limits"] as const;

export const isQuietPath = (pathname: string) =>
  QUIET_SECTIONS.some((s) => new RegExp(`^/(si|ta|en)/${s}(/|$)`).test(pathname));
