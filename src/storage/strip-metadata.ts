import { readFile, writeFile } from "node:fs/promises";
import { APIError, type CollectionBeforeOperationHook } from "payload";
import sharp, { type Metadata } from "sharp";

/**
 * Content rule 5: no coordinates anywhere. A phone photo's EXIF holds the GPS position where it
 * was taken, which for a living elephant (or a person's farm) is an exact location.
 *
 * Payload alone does NOT strip it: `withMetadata: false` only applies when Payload re-encodes the
 * file, and it only re-encodes originals when resize/format/trim options are set. So every image
 * is re-encoded here, before Payload or Cloudinary sees it. Fail closed: anything we can't decode
 * is refused rather than stored with its metadata.
 */

/** Shown in the admin when an upload is refused. */
export const MSG_UNREADABLE_IMAGE =
  "This image format can't be checked for location data. Convert it to JPEG or PNG and upload again.";
export const MSG_VIDEO_LOCATION =
  "This video contains location (GPS) data. Remove it before uploading (e.g. re-export it, or turn off location in the camera app).";

const refuse = (message: string) => new APIError(message, 400, null, true);

const PASS_THROUGH = new Set(["image/svg+xml"]); // vector, no EXIF block

/** True for image types that are re-encoded to drop metadata. */
export const isRasterImage = (mime: string) => mime.startsWith("image/") && !PASS_THROUGH.has(mime);
const isIsoVideo = (mime: string) => mime === "video/mp4" || mime === "video/quicktime" || mime === "video/x-m4v";

/** Re-encodes an image with no EXIF, XMP, IPTC or ICC block. Orientation is applied to the pixels first. */
export async function stripImageMetadata(input: Buffer): Promise<Buffer> {
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw refuse(MSG_UNREADABLE_IMAGE);
  }
  const animated = (meta.pages ?? 1) > 1;
  try {
    // Sharp writes no metadata unless asked (keepExif/withMetadata), and converts to sRGB.
    let img = sharp(input, { animated }).autoOrient();
    if (meta.format === "jpeg") img = img.jpeg({ quality: 90 });
    else if (meta.format === "webp") img = img.webp({ quality: 90 });
    else if (meta.format === "heif") img = img.avif({ quality: 70 }); // sharp reports AVIF as heif; HEIC (HEVC) fails to decode → refused
    return await img.toBuffer();
  } catch {
    throw refuse(MSG_UNREADABLE_IMAGE);
  }
}

/** True if a raster image still carries an EXIF, XMP or IPTC block. Throws for undecodable input. */
export async function hasImageMetadata(input: Buffer): Promise<boolean> {
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw refuse(MSG_UNREADABLE_IMAGE);
  }
  return Boolean(meta.exif || meta.xmp || meta.iptc);
}

// ISO-BMFF location markers: QuickTime `©xyz`, 3GPP `loci`, Apple `mdta` key name.
const VIDEO_LOCATION_MARKERS = [Buffer.from([0xa9, 0x78, 0x79, 0x7a]), Buffer.from("loci"), Buffer.from("location.ISO6709")];
const MEDIA_DATA_BOXES = new Set(["mdat", "free", "skip", "wide"]);

/**
 * True if an MP4/MOV file has location metadata. Only the metadata boxes (moov, meta, uuid…) are
 * searched; the large `mdat` media payload is skipped so random bytes can't trigger a false match.
 * A file whose box structure can't be read counts as "has location" (fail closed).
 */
export function videoHasLocation(buf: Buffer): boolean {
  let pos = 0;
  while (pos + 8 <= buf.length) {
    let size = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    let header = 8;
    if (size === 1) {
      if (pos + 16 > buf.length) return true;
      size = Number(buf.readBigUInt64BE(pos + 8));
      header = 16;
    } else if (size === 0) {
      size = buf.length - pos;
    }
    if (size < header || pos + size > buf.length) return true; // truncated or malformed
    if (!MEDIA_DATA_BOXES.has(type)) {
      const body = buf.subarray(pos + header, pos + size);
      if (VIDEO_LOCATION_MARKERS.some((m) => body.includes(m))) return true;
    }
    pos += size;
  }
  return false;
}

/**
 * Returns bytes that are safe to store: images re-encoded without metadata, videos checked for GPS.
 * `force: false` keeps an already-clean image as is (no second lossy re-encode).
 */
export async function cleanUploadBuffer(buf: Buffer, mime: string, { force = true } = {}): Promise<Buffer> {
  if (isRasterImage(mime)) {
    if (!force && !(await hasImageMetadata(buf))) return buf;
    return stripImageMetadata(buf);
  }
  if (isIsoVideo(mime) && videoHasLocation(buf)) throw refuse(MSG_VIDEO_LOCATION);
  return buf;
}

/** Collection hook: cleans the incoming file before Payload processes, resizes or stores it. */
export const stripUploadMetadata: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== "create" && operation !== "update") return args;
  const file = req.file;
  if (!file) return args;
  const fromDisk = file.tempFilePath && file.data.length === 0;
  const original = fromDisk ? await readFile(file.tempFilePath!) : file.data;
  const cleaned = await cleanUploadBuffer(original, file.mimetype);
  if (cleaned === original) return args;
  if (fromDisk) {
    await writeFile(file.tempFilePath!, cleaned);
    req.file = { ...file, size: cleaned.length };
  } else {
    req.file = { ...file, data: cleaned, size: cleaned.length };
  }
  return args;
};
