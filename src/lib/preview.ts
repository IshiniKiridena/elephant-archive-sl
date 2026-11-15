import { createHash, timingSafeEqual } from "node:crypto";
// Relative imports: Sources.ts uses previewUrl, and the Payload CLI loads collections outside Next
import { hasRole } from "../access/roles";
import { isLocale, localeHref } from "../i18n/config";

/**
 * Draft preview (Next.js draft mode). Turning it on needs both:
 *  - the PREVIEW_SECRET from env (the admin's Preview button carries it), and
 *  - a logged-in Payload user with a staff role (editor, reviewer, legal or admin).
 * Pages re-check the user in draft mode too (see lib/sources/get-source.ts), because Next's
 * draft cookie isn't tied to a person.
 */

/** Staff who may see drafts on the public site. Admins always pass hasRole. */
export const canPreview = (user: unknown) => hasRole(user, "editor", "reviewer", "legal");

/** Only our own locale paths: /si, /ta/sources/example… Never //host, http:, ../ or other locales. */
const PREVIEW_PATH = /^\/(si|ta|en)(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;
export const safePreviewPath = (p: string | null | undefined): string | null => (p && PREVIEW_PATH.test(p) ? p : null);

const digest = (s: string) => createHash("sha256").update(s).digest();

/** Constant-time compare. An unset or empty secret turns preview off: nothing matches. */
export function checkPreviewSecret(given: string | null | undefined, expected: string | null | undefined): boolean {
  const want = expected?.trim();
  if (!want || !given) return false;
  return timingSafeEqual(digest(given.trim()), digest(want));
}

/** Link for the admin's Preview button, or null (no button) when preview isn't configured. */
export function previewUrl(path: string, locale: unknown, secret = process.env.PREVIEW_SECRET): string | null {
  const s = secret?.trim();
  if (!s) return null;
  const target = safePreviewPath(localeHref(typeof locale === "string" && isLocale(locale) ? locale : "en", path));
  return target && `/next/preview?${new URLSearchParams({ secret: s, path: target })}`;
}

const refuse = (status: number, message: string) =>
  new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export type EnablePreviewDeps = {
  secret: string | null | undefined;
  /** The Payload user from the request's cookie, or null. */
  getUser: () => Promise<unknown>;
  /** Turns on Next draft mode; called only after every check passed. */
  enable: () => Promise<void> | void;
};

/** GET /next/preview?secret=…&path=/en/sources/example */
export async function handleEnablePreview(request: Request, deps: EnablePreviewDeps): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const path = safePreviewPath(params.get("path"));
  if (!path) return refuse(400, "Invalid preview path.");
  if (!checkPreviewSecret(params.get("secret"), deps.secret)) return refuse(401, "Preview link is invalid or preview is not configured.");
  const user = await deps.getUser();
  if (!user) return refuse(401, "Log in to the admin first, then use its Preview button.");
  if (!canPreview(user)) return refuse(403, "Your account can't preview drafts.");

  await deps.enable();
  // The link carried the secret: don't let the next page leak it in a Referer
  return new Response(null, { status: 307, headers: { Location: path, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

/** Where /next/exit-preview sends you: back to the page you were on (same site only), else /en. */
export function exitPreviewTarget(request: Request): string {
  try {
    const ref = new URL(request.headers.get("referer") ?? "");
    if (ref.origin === new URL(request.url).origin) return safePreviewPath(ref.pathname) ?? "/en";
  } catch {
    // no or malformed Referer
  }
  return "/en";
}
