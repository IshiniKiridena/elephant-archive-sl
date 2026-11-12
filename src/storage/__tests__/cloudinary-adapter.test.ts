import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";
import type { CollectionConfig, PayloadRequest } from "payload";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cloudinaryAdapter, resourceTypeFor, uploadOptionsFor } from "../cloudinary-adapter";
import { readCloudinaryEnv } from "../cloudinary-env";

const CLOUD = "example-cloud";
const media = cloudinaryAdapter({ delivery: "public", folder: "media", cloudName: CLOUD })({ collection: { slug: "media" } as CollectionConfig });
const intake = cloudinaryAdapter({ delivery: "private", folder: "intake", cloudName: CLOUD })({
  collection: { slug: "intake-files" } as CollectionConfig,
});
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

afterEach(() => vi.restoreAllMocks());

/** Replaces the network upload with a fake that records what would have been sent. */
function captureUploads() {
  const sent: { options: UploadApiOptions; buffer: Buffer }[] = [];
  vi.spyOn(cloudinary.uploader, "upload_stream").mockImplementation(((options: UploadApiOptions, cb: (e: unknown, r: unknown) => void) => ({
    end(buffer: Buffer) {
      sent.push({ options, buffer });
      cb(undefined, { public_id: options.public_id, resource_type: options.resource_type, format: "jpg" });
    },
  })) as unknown as typeof cloudinary.uploader.upload_stream);
  return sent;
}

const upload = (adapter: typeof media, buffer: Buffer, filename: string, mimeType: string) =>
  adapter.handleUpload({
    clientUploadContext: undefined,
    collection: {} as CollectionConfig,
    data: {},
    file: { buffer, filename, filesize: buffer.length, mimeType },
    req: {} as PayloadRequest,
    storageFilePath: filename,
  });

describe("upload options", () => {
  it("stores intake files as Cloudinary `authenticated` assets with a random id that hides the filename", () => {
    const o = uploadOptionsFor({ delivery: "private", folder: "intake", cloudName: CLOUD }, { filename: "Witness Name 2026.png", mimeType: "image/png" });
    expect(o.type).toBe("authenticated");
    expect(o.resource_type).toBe("image");
    expect(o.public_id).toMatch(new RegExp(`^intake/${UUID}$`));
    expect(o.overwrite).toBe(false);
  });

  it("stores intake documents as raw, keeping only the extension", () => {
    const o = uploadOptionsFor({ delivery: "private", folder: "intake", cloudName: CLOUD }, { filename: "Court Order.PDF", mimeType: "application/pdf" });
    expect(o.resource_type).toBe("raw");
    expect(o.public_id).toMatch(new RegExp(`^intake/${UUID}\\.pdf$`));
  });

  it("stores media as public `upload` assets", () => {
    const o = uploadOptionsFor({ delivery: "public", folder: "media", cloudName: CLOUD }, { filename: "herd.jpg", mimeType: "image/jpeg" });
    expect(o.type).toBe("upload");
    expect(o.public_id).toMatch(new RegExp(`^media/${UUID}$`));
  });

  it("picks resource types", () => {
    expect(resourceTypeFor("video/mp4", "public")).toBe("video");
    expect(resourceTypeFor("video/mp4", "private")).toBe("raw");
    expect(resourceTypeFor("text/csv", "private")).toBe("raw");
  });
});

describe("handleUpload", () => {
  it.each([
    ["media", media],
    ["intake-files", intake],
  ] as const)("%s: the bytes sent to Cloudinary carry no GPS, even if the hook was skipped", async (_name, adapter) => {
    const sent = captureUploads();
    const gpsJpeg = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#556b2f" } })
      .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "7/1 0/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "80/1 0/1 0/1" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(gpsJpeg).metadata()).exif).toBeDefined();

    const saved = await upload(adapter, gpsJpeg, "photo.jpg", "image/jpeg");
    expect(sent).toHaveLength(1);
    expect((await sharp(sent[0].buffer).metadata()).exif).toBeUndefined();
    expect(saved).toMatchObject({ cloudinaryPublicId: sent[0].options.public_id, cloudinaryResourceType: "image" });
  });
});

describe("URLs", () => {
  const doc = { cloudinaryPublicId: "intake/abc", cloudinaryResourceType: "image", cloudinaryFormat: "png" };

  it("never gives an intake file a Cloudinary URL, only the admin-checked file route", async () => {
    const url = await intake.generateURL!({ collection: {} as CollectionConfig, data: doc, filename: "a b.png" });
    expect(url).toBe("/api/intake-files/file/a%20b.png");
  });

  it("gives media a public URL with f_auto,q_auto and a width cap", async () => {
    const url = await media.generateURL!({ collection: {} as CollectionConfig, data: { ...doc, cloudinaryPublicId: "media/abc" }, filename: "x.jpg" });
    expect(url).toBe(`https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_limit,w_1600/media/abc`);
  });

  it("deletes intake assets with the authenticated type", async () => {
    const destroy = vi.spyOn(cloudinary.uploader, "destroy").mockResolvedValue({ result: "ok" });
    await intake.handleDelete({ collection: {} as CollectionConfig, doc: doc as never, filename: "a.png", req: {} as PayloadRequest, storageFilePath: "" });
    expect(destroy).toHaveBeenCalledWith("intake/abc", expect.objectContaining({ type: "authenticated", resource_type: "image" }));
  });
});

describe("readCloudinaryEnv", () => {
  const all = { CLOUDINARY_CLOUD_NAME: "c", CLOUDINARY_API_KEY: "k", CLOUDINARY_API_SECRET: "s" };
  it("is off when nothing is set (local disk)", () => expect(readCloudinaryEnv({})).toBeNull());
  it("reads all three", () => expect(readCloudinaryEnv(all)).toEqual({ cloudName: "c", apiKey: "k", apiSecret: "s" }));
  it("refuses a half-set config", () => expect(() => readCloudinaryEnv({ CLOUDINARY_CLOUD_NAME: "c" })).toThrow(/CLOUDINARY_API_KEY/));
  it("refuses to run on Vercel without it", () => expect(() => readCloudinaryEnv({ VERCEL: "1" })).toThrow(/not configured/));
});
