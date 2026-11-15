import type { MetadataRoute } from "next";
import { getMessages } from "@/i18n/get-messages";
import { tokens } from "@/styles/tokens";

/**
 * /manifest.webmanifest. Icons are generated from public/brand/badge.svg by `pnpm brand:icons`
 * (see design/logos.md). English names: the manifest has one language, and the logo's words are English.
 */
export default function manifest(): MetadataRoute.Manifest {
  const m = getMessages("en");
  return {
    name: m.siteName,
    short_name: "Elephant Archive",
    description: m.tagline,
    lang: "en",
    start_url: "/",
    display: "standalone",
    background_color: tokens.canopy,
    theme_color: tokens.canopy,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
