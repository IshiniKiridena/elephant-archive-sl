/**
 * `next/image` loader: Cloudinary does the resizing, so Vercel's image optimisation is never used.
 * Runs in the browser too, so it only rewrites the URL; no env or secrets are needed.
 *
 * https://res.cloudinary.com/<cloud>/image/upload/<any transformation>/<public id>
 *   → https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,c_limit,w_<width>/<public id>
 * Any other src (e.g. logos in /public) is returned unchanged, with ?w= so Next sees the width used.
 */
export const LOADER_MAX_WIDTH = 1600; // keep in sync with MEDIA_MAX_WIDTH in src/storage/cloudinary-urls.ts

const CLOUDINARY_IMAGE = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/;
// A path segment is a transformation if it is made of `x_value` parts (e.g. f_auto,q_auto,w_640).
const TRANSFORMATION = /^[a-z]{1,3}_[^/]*$/;

export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const w = Math.max(1, Math.min(Math.round(width), LOADER_MAX_WIDTH));
  const m = CLOUDINARY_IMAGE.exec(src);
  if (!m) return `${src}${src.includes("?") ? "&" : "?"}w=${w}`;
  const [, cloud, rest] = m;
  const segments = rest.split("/");
  while (segments.length > 1 && TRANSFORMATION.test(segments[0])) segments.shift();
  const q = quality && quality > 0 && quality <= 100 ? `q_${Math.round(quality)}` : "q_auto";
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,${q},c_limit,w_${w}/${segments.join("/")}`;
}
