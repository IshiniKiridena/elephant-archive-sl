import { v2 as cloudinary } from "cloudinary";

/** Widest image the public site ever asks Cloudinary for. Keeps transformations and bandwidth small. */
export const MEDIA_MAX_WIDTH = 1600;
export const VIDEO_MAX_WIDTH = 1280;
/** How long a signed intake-file link works. */
export const INTAKE_URL_TTL_SECONDS = 300;

export type ResourceType = "image" | "video" | "raw";

/**
 * Cloudinary delivery type for intake files. `authenticated`, not `private`: on `private` assets
 * only the original is protected, and any transformed copy (e.g. /image/private/w_100/<id>) is served
 * unsigned (found by tests/int/cloudinary.int.spec.ts). `authenticated` refuses every unsigned URL.
 */
export const INTAKE_DELIVERY_TYPE = "authenticated";

/** What is stored on each upload document to find its Cloudinary asset again. */
export type StoredAsset = {
  cloudinaryPublicId?: string | null;
  cloudinaryResourceType?: ResourceType | string | null;
  cloudinaryFormat?: string | null;
};

const asResourceType = (v: unknown): ResourceType => (v === "video" || v === "raw" ? v : "image");

/**
 * Public delivery URL for a `media` asset, always with a format/quality/width transformation.
 * The `next/image` loader swaps the transformation for a width-specific one.
 */
export function publicDeliveryUrl(cloudName: string, asset: StoredAsset): string {
  const id = asset.cloudinaryPublicId;
  if (!id) throw new Error("Asset has no Cloudinary public id");
  const type = asResourceType(asset.cloudinaryResourceType);
  const path = id.split("/").map(encodeURIComponent).join("/");
  const base = `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/${type}/upload`;
  if (type === "image") return `${base}/f_auto,q_auto,c_limit,w_${MEDIA_MAX_WIDTH}/${path}`;
  if (type === "video") return `${base}/f_auto,q_auto,c_limit,w_${VIDEO_MAX_WIDTH}/${path}`;
  return `${base}/${path}`;
}

/**
 * Short-lived signed link to an intake file (Cloudinary `authenticated` delivery type).
 * Uses the Upload API's download endpoint, which honours `expires_at`; plain signed delivery URLs
 * (`s--…--`) never expire, so they are never generated for intake files.
 * Requires the SDK to be configured with the API secret (see `cloudinaryFromEnv`). Server only.
 */
export function signIntakeUrl(
  asset: StoredAsset,
  { ttlSeconds = INTAKE_URL_TTL_SECONDS, now = Date.now() }: { ttlSeconds?: number; now?: number } = {},
): { url: string; expiresAt: string } {
  const id = asset.cloudinaryPublicId;
  if (!id) throw new Error("Intake file has no Cloudinary public id");
  const expiresAt = Math.floor(now / 1000) + ttlSeconds;
  const url = cloudinary.utils.private_download_url(id, asset.cloudinaryFormat ?? "", {
    resource_type: asResourceType(asset.cloudinaryResourceType),
    type: INTAKE_DELIVERY_TYPE,
    expires_at: expiresAt,
  });
  return { url, expiresAt: new Date(expiresAt * 1000).toISOString() };
}
