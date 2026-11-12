import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { PayloadRequest } from "payload";
import sharp, { type Sharp } from "sharp";
import { describe, expect, it } from "vitest";
import {
  MSG_UNREADABLE_IMAGE,
  MSG_VIDEO_LOCATION,
  cleanUploadBuffer,
  stripImageMetadata,
  stripUploadMetadata,
  videoHasLocation,
} from "../strip-metadata";

// Clearly fake test position (not a real event location).
const GPS = { GPSLatitudeRef: "N", GPSLatitude: "7/1 30/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "80/1 30/1 0/1" };
const XMP = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:exif="http://ns.adobe.com/exif/1.0/" exif:GPSLatitude="7,30.0N"/></rdf:RDF></x:xmpmeta>`;

const base = () => sharp({ create: { width: 40, height: 20, channels: 3, background: "#7a8a6a" } });
// Orientation 6 = "rotate 90° to view", as phones write it.
const withGps = (s: Sharp) => s.withExif({ IFD0: { Make: "TestCam" }, IFD3: GPS }).withMetadata({ orientation: 6 });

/** GPS IFD pointer tag (0x8825) in either byte order. */
const hasGpsPointer = (exif?: Buffer) => !!exif && (exif.includes(Buffer.from([0x88, 0x25])) || exif.includes(Buffer.from([0x25, 0x88])));

async function expectNoMetadata(buf: Buffer) {
  const m = await sharp(buf).metadata();
  expect(m.exif).toBeUndefined();
  expect(m.xmp).toBeUndefined();
  expect(m.iptc).toBeUndefined();
  expect(buf.includes(Buffer.from("Exif\0\0"))).toBe(false);
  expect(buf.includes(Buffer.from("GPSLatitude"))).toBe(false);
}

describe("stripImageMetadata", () => {
  it("removes GPS EXIF from a JPEG and applies the orientation to the pixels", async () => {
    const input = await withGps(base()).jpeg().toBuffer();
    const before = await sharp(input).metadata();
    expect(hasGpsPointer(before.exif)).toBe(true); // the fixture really carries GPS
    expect(before.orientation).toBe(6);

    const out = await stripImageMetadata(input);
    await expectNoMetadata(out);
    const after = await sharp(out).metadata();
    expect(after.format).toBe("jpeg");
    expect([after.width, after.height]).toEqual([20, 40]); // rotated, not sideways
    expect(after.orientation).toBeUndefined();
  });

  it("removes GPS held in XMP", async () => {
    const input = await base().withXmp(XMP).jpeg().toBuffer();
    expect((await sharp(input).metadata()).xmp).toBeDefined();
    await expectNoMetadata(await stripImageMetadata(input));
  });

  it.each(["png", "webp"] as const)("removes GPS EXIF from %s", async (format) => {
    const input = await withGps(base()).toFormat(format).toBuffer();
    expect(hasGpsPointer((await sharp(input).metadata()).exif)).toBe(true);
    const out = await stripImageMetadata(input);
    await expectNoMetadata(out);
    expect((await sharp(out).metadata()).format).toBe(format);
  });

  it("refuses an image it cannot decode instead of storing it unchecked", async () => {
    await expect(stripImageMetadata(Buffer.from("not really a jpeg"))).rejects.toThrow(MSG_UNREADABLE_IMAGE);
  });
});

describe("cleanUploadBuffer", () => {
  it("passes SVG and documents through untouched", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
    const pdf = Buffer.from("%PDF-1.4 fake");
    expect(await cleanUploadBuffer(svg, "image/svg+xml")).toBe(svg);
    expect(await cleanUploadBuffer(pdf, "application/pdf")).toBe(pdf);
  });

  it("with force:false keeps an already-clean image as is, but still strips a dirty one", async () => {
    const clean = await base().jpeg().toBuffer();
    expect(await cleanUploadBuffer(clean, "image/jpeg", { force: false })).toBe(clean);
    const dirty = await withGps(base()).jpeg().toBuffer();
    await expectNoMetadata(await cleanUploadBuffer(dirty, "image/jpeg", { force: false }));
  });
});

// ── MP4 / MOV ───────────────────────────────────────────────────────────────
const box = (type: string | Buffer, ...children: Buffer[]) => {
  const body = Buffer.concat(children);
  const head = Buffer.alloc(8);
  head.writeUInt32BE(8 + body.length, 0);
  (typeof type === "string" ? Buffer.from(type, "latin1") : type).copy(head, 4);
  return Buffer.concat([head, body]);
};
const XYZ = Buffer.from([0xa9, 0x78, 0x79, 0x7a]); // ©xyz
const ftyp = box("ftyp", Buffer.from("isom\0\0\0\0isommp41"));
const mvhd = box("mvhd", Buffer.alloc(100));

describe("videoHasLocation", () => {
  it("finds a QuickTime ©xyz location atom", () => {
    const mp4 = Buffer.concat([ftyp, box("moov", mvhd, box("udta", box(XYZ, Buffer.from("+07.5000+080.5000/")))), box("mdat", Buffer.alloc(64))]);
    expect(videoHasLocation(mp4)).toBe(true);
  });

  it("finds an Apple location key and a 3GPP loci box", () => {
    const apple = Buffer.concat([ftyp, box("moov", box("meta", box("keys", Buffer.from("mdtacom.apple.quicktime.location.ISO6709"))))]);
    const gpp = Buffer.concat([ftyp, box("moov", box("udta", box("loci", Buffer.alloc(20))))]);
    expect(videoHasLocation(apple)).toBe(true);
    expect(videoHasLocation(gpp)).toBe(true);
  });

  it("passes a video without location, even if the media data happens to contain the marker bytes", () => {
    const mp4 = Buffer.concat([ftyp, box("moov", mvhd), box("mdat", Buffer.concat([Buffer.alloc(32), XYZ, Buffer.from("loci")]))]);
    expect(videoHasLocation(mp4)).toBe(false);
  });

  it("treats a malformed file as having location (fail closed)", () => {
    const bad = Buffer.concat([ftyp, Buffer.from([0, 0, 0xff, 0xff]), Buffer.from("moov")]);
    expect(videoHasLocation(bad)).toBe(true);
  });

  it("cleanUploadBuffer refuses an MP4 with location", async () => {
    const mp4 = Buffer.concat([ftyp, box("moov", box("udta", box(XYZ, Buffer.from("+07.5+080.5/"))))]);
    await expect(cleanUploadBuffer(mp4, "video/mp4")).rejects.toThrow(MSG_VIDEO_LOCATION);
    const clean = Buffer.concat([ftyp, box("moov", mvhd)]);
    expect(await cleanUploadBuffer(clean, "video/mp4")).toBe(clean);
  });
});

// ── Collection hook ─────────────────────────────────────────────────────────
type HookArgs = Parameters<typeof stripUploadMetadata>[0];
const runHook = (req: Partial<PayloadRequest>, operation: HookArgs["operation"] = "create") =>
  stripUploadMetadata({ args: {}, operation, req: req as PayloadRequest, context: {}, collection: {} } as unknown as HookArgs);

describe("stripUploadMetadata hook", () => {
  it("replaces the incoming file with a copy that has no GPS", async () => {
    const data = await withGps(base()).jpeg().toBuffer();
    const req: Partial<PayloadRequest> = { file: { data, mimetype: "image/jpeg", name: "photo.jpg", size: data.length } };
    await runHook(req);
    expect(req.file!.data).not.toBe(data);
    expect(req.file!.size).toBe(req.file!.data.length);
    await expectNoMetadata(req.file!.data);
  });

  it("cleans a file that Payload buffered to a temp file", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "strip-test-"));
    try {
      const tmp = path.join(dir, "upload.jpg");
      await writeFile(tmp, await withGps(base()).jpeg().toBuffer());
      const req: Partial<PayloadRequest> = { file: { data: Buffer.alloc(0), tempFilePath: tmp, mimetype: "image/jpeg", name: "photo.jpg", size: 1 } };
      await runHook(req, "update");
      await expectNoMetadata(await readFile(tmp));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("leaves other operations alone", async () => {
    const data = await withGps(base()).jpeg().toBuffer();
    const req: Partial<PayloadRequest> = { file: { data, mimetype: "image/jpeg", name: "photo.jpg", size: data.length } };
    await runHook(req, "read");
    expect(req.file!.data).toBe(data);
  });
});
