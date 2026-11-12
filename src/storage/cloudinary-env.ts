import { v2 as cloudinary } from "cloudinary";

export type CloudinaryEnv = { cloudName: string; apiKey: string; apiSecret: string };

const NAMES = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

/**
 * Reads the Cloudinary credentials.
 * - none set: returns null, and uploads stay on local disk (dev, CI)
 * - some set: throws, because a half-configured store is always a mistake
 * - none set on Vercel: throws, because files would land on a temporary disk and vanish
 */
export function readCloudinaryEnv(env: Record<string, string | undefined> = process.env): CloudinaryEnv | null {
  const values = NAMES.map((n) => env[n]?.trim() || "");
  const set = values.filter(Boolean).length;
  if (set === 0) {
    if (env.VERCEL) throw new Error(`Cloudinary is not configured. Set ${NAMES.join(", ")} in the Vercel project.`);
    return null;
  }
  if (set < NAMES.length) {
    const missing = NAMES.filter((_, i) => !values[i]);
    throw new Error(`Cloudinary is partly configured. Missing: ${missing.join(", ")}`);
  }
  const [cloudName, apiKey, apiSecret] = values;
  return { cloudName, apiKey, apiSecret };
}

let configured: CloudinaryEnv | null | undefined;

/** Configures the SDK once from env and returns the credentials, or null when Cloudinary is off. */
export function cloudinaryFromEnv(): CloudinaryEnv | null {
  if (configured === undefined) {
    configured = readCloudinaryEnv();
    if (configured) {
      cloudinary.config({ cloud_name: configured.cloudName, api_key: configured.apiKey, api_secret: configured.apiSecret, secure: true });
    }
  }
  return configured;
}
