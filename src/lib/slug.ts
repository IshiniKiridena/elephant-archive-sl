/**
 * URL slugs for public pages: lowercase ASCII words joined by hyphens.
 * Sinhala and Tamil titles have no ASCII form, so they get the fallback word instead of a
 * transliteration (a machine transliteration would be an unreviewed translation, rule 9).
 */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 80;

export function slugify(text: string | null | undefined, fallback = "item"): string {
  const ascii = (text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const cut = ascii.slice(0, SLUG_MAX).replace(/-+$/, "");
  return cut || fallback;
}

/** `base`, or `base-2`, `base-3`… for the first one `isTaken` says is free. */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  for (let n = 1; n < 1000; n++) {
    const suffix = n === 1 ? "" : `-${n}`;
    const candidate = `${base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/, "")}${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error(`No free slug for "${base}"`);
}
