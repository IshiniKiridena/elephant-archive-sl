// @vitest-environment node
/**
 * Live checks against the real Cloudinary account in .env. No database needed.
 * Skipped unless CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET are all set.
 * Uploads three tiny generated test files and deletes them again in afterAll.
 */
import type { GeneratedAdapter } from "@payloadcms/plugin-cloud-storage/types";
import type { CollectionConfig, PayloadRequest } from "payload";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cloudinaryAdapter } from "@/storage/cloudinary-adapter";
import { cloudinaryFromEnv } from "@/storage/cloudinary-env";
import { signIntakeUrl, type StoredAsset } from "@/storage/cloudinary-urls";

const hasCloudinary = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].every((n) => process.env[n]);

describe.skipIf(!hasCloudinary)("Cloudinary storage (live)", { timeout: 60_000 }, () => {
  let cloud = "";
  let media: GeneratedAdapter;
  let intake: GeneratedAdapter;
  const created: { adapter: GeneratedAdapter; asset: StoredAsset }[] = [];

  let gpsJpeg: Buffer;
  let intakeImage: StoredAsset;
  let intakeText: StoredAsset;
  let mediaImage: StoredAsset;

  const upload = async (adapter: GeneratedAdapter, buffer: Buffer, filename: string, mimeType: string) => {
    const asset = (await adapter.handleUpload({
      clientUploadContext: undefined,
      collection: {} as CollectionConfig,
      data: {},
      file: { buffer, filename, filesize: buffer.length, mimeType },
      req: {} as PayloadRequest,
      storageFilePath: filename,
    })) as StoredAsset;
    created.push({ adapter, asset });
    return asset;
  };
  const status = async (url: string) => (await fetch(url, { redirect: "follow" })).status;
  const exifOf = async (url: string) => {
    const res = await fetch(url);
    expect(res.status).toBe(200);
    return (await sharp(Buffer.from(await res.arrayBuffer())).metadata()).exif;
  };

  beforeAll(async () => {
    cloud = cloudinaryFromEnv()!.cloudName;
    media = cloudinaryAdapter({ delivery: "public", folder: "test-media", cloudName: cloud })({ collection: { slug: "media" } as CollectionConfig });
    intake = cloudinaryAdapter({ delivery: "private", folder: "test-intake", cloudName: cloud })({
      collection: { slug: "intake-files" } as CollectionConfig,
    });
    // A plain grey square with a clearly fake GPS tag.
    gpsJpeg = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#808080" } })
      .withExif({ IFD0: { ImageDescription: "Test image, delete me" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "7/1 0/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "80/1 0/1 0/1" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(gpsJpeg).metadata()).exif).toBeDefined();

    intakeImage = await upload(intake, gpsJpeg, "test.jpg", "image/jpeg");
    intakeText = await upload(intake, Buffer.from("Example intake note, test only"), "note.txt", "text/plain");
    mediaImage = await upload(media, gpsJpeg, "test.jpg", "image/jpeg");
  });

  afterAll(async () => {
    for (const { adapter, asset } of created) {
      await adapter.handleDelete({ collection: {} as CollectionConfig, doc: asset as never, filename: "", req: {} as PayloadRequest, storageFilePath: "" });
    }
  });

  describe("intake file can't be opened without signing", () => {
    it("refuses every unsigned delivery URL for a private image", async () => {
      const id = intakeImage.cloudinaryPublicId!;
      for (const url of [
        `https://res.cloudinary.com/${cloud}/image/authenticated/${id}.jpg`,
        `https://res.cloudinary.com/${cloud}/image/authenticated/${id}`,
        // transformed copies too (on `private` assets these were served unsigned)
        `https://res.cloudinary.com/${cloud}/image/authenticated/w_100/${id}.jpg`,
        `https://res.cloudinary.com/${cloud}/image/authenticated/f_auto,q_auto/${id}`,
        `https://res.cloudinary.com/${cloud}/image/private/${id}.jpg`,
        `https://res.cloudinary.com/${cloud}/image/private/w_100/${id}.jpg`,
        `https://res.cloudinary.com/${cloud}/image/upload/${id}.jpg`,
        `https://res.cloudinary.com/${cloud}/image/upload/w_100/${id}.jpg`,
      ]) {
        expect(await status(url), url).not.toBe(200);
      }
    });

    it("refuses unsigned URLs for a private document", async () => {
      const id = intakeText.cloudinaryPublicId!;
      for (const type of ["authenticated", "private", "upload"]) {
        expect(await status(`https://res.cloudinary.com/${cloud}/raw/${type}/${id}`), type).not.toBe(200);
      }
    });

    it("opens with a fresh signed link", async () => {
      const res = await fetch(signIntakeUrl(intakeText).url);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Example intake note, test only");
    });

    it("refuses an expired signed link", async () => {
      const expired = signIntakeUrl(intakeImage, { now: Date.now() - 3_600_000, ttlSeconds: 60 }).url;
      expect(await status(expired)).not.toBe(200);
    });

    it("refuses a signed link whose expiry was edited", async () => {
      const url = new URL(signIntakeUrl(intakeImage, { now: Date.now() - 3_600_000, ttlSeconds: 60 }).url);
      url.searchParams.set("expires_at", String(Math.floor(Date.now() / 1000) + 86_400));
      expect(await status(url.toString())).not.toBe(200);
    });
  });

  describe("stored images carry no GPS", () => {
    it("intake original (via signed link) has no EXIF", async () => {
      expect(await exifOf(signIntakeUrl(intakeImage).url)).toBeUndefined();
    });

    it("media original (untransformed public URL) has no EXIF", async () => {
      expect(await exifOf(`https://res.cloudinary.com/${cloud}/image/upload/${mediaImage.cloudinaryPublicId}`)).toBeUndefined();
    });

    it("media delivery URL from generateURL works", async () => {
      const url = await media.generateURL!({ collection: {} as CollectionConfig, data: mediaImage, filename: "test.jpg" });
      expect(url).toContain("/f_auto,q_auto,c_limit,w_1600/");
      expect(await status(url)).toBe(200);
    });
  });
});
