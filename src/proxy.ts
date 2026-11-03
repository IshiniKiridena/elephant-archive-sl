import { NextResponse, type NextRequest } from "next/server";
import { isLocale, negotiateLocale } from "./i18n/config";

/**
 * "/" and any path without a locale → redirect to /si, /ta or /en (browser language, else /en).
 * Pages themselves stay static: zone comes from the route group, data saver from CSS + a tiny inline script.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isLocale(pathname.split("/")[1])) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${negotiateLocale(req.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Payload admin + API, share-card images, Next internals and static files
  matcher: ["/((?!admin|api|share-card|_next|favicon.ico|icon|apple-icon|brand|icons|fonts|robots.txt|sitemap.xml|.*\\.[a-z0-9]+$).*)"],
};
