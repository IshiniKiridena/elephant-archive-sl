import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Adapter, GeneratedAdapter } from "@payloadcms/plugin-cloud-storage/types";
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import type { Field, FileData, PayloadRequest, TypeWithID } from "payload";
import { hasRole } from "../access/roles";
import { INTAKE_DELIVERY_TYPE, publicDeliveryUrl, type ResourceType, type StoredAsset } from "./cloudinary-urls";
import { respondWithSignedIntakeUrl } from "./signed-intake-url";
import { cleanUploadBuffer } from "./strip-metadata";

/**
 * Small Cloudinary adapter for Payload's official storage plugin.
 *  public  (media):        `upload` type, served straight from Cloudinary with f_auto,q_auto and a width cap
 *  private (intake-files): `authenticated` type; Cloudinary refuses every unsigned request (originals and
 *                          transformed copies), and the only way in is a short-lived signed link handed
 *                          to admins (see signed-intake-url.ts)
 * Public ids are random, never derived from the filename, so names don't leak and URLs can't be guessed.
 */
export type CloudinaryAdapterOptions = {
  delivery: "public" | "private";
  /** Folder prefix inside the Cloudinary account, e.g. "media" or "intake" */
  folder: string;
  cloudName: string;
};

/** Cloudinary's resource type for a file. Intake documents go to `raw` (PDF delivery is blocked on free plans). */
export function resourceTypeFor(mimeType: string, delivery: CloudinaryAdapterOptions["delivery"]): ResourceType {
  if (mimeType.startsWith("image/")) return "image";
  if (delivery === "public" && mimeType.startsWith("video/")) return "video";
  return "raw";
}

/** Upload options for one file. Exported for tests. */
export function uploadOptionsFor(opts: CloudinaryAdapterOptions, file: { filename: string; mimeType: string }): UploadApiOptions {
  const resource_type = resourceTypeFor(file.mimeType, opts.delivery);
  // Raw assets keep their extension in the public id; image/video ids carry no extension.
  const ext = resource_type === "raw" ? path.extname(file.filename).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  return {
    public_id: `${opts.folder}/${randomUUID()}${ext}`,
    resource_type,
    type: opts.delivery === "private" ? INTAKE_DELIVERY_TYPE : "upload",
    overwrite: false,
    use_filename: false,
    unique_filename: false,
  };
}

const adminOnlyRead = { read: ({ req }: { req: PayloadRequest }) => hasRole(req.user) };

function assetFields(delivery: CloudinaryAdapterOptions["delivery"]): Field[] {
  const admin = { hidden: true, readOnly: true, disableBulkEdit: true, disableListColumn: true, disableListFilter: true };
  const access = delivery === "private" ? adminOnlyRead : undefined;
  return [
    { name: "cloudinaryPublicId", type: "text", index: true, admin, access },
    { name: "cloudinaryResourceType", type: "text", admin, access },
    { name: "cloudinaryFormat", type: "text", admin, access },
  ];
}

const uploadBuffer = (buffer: Buffer, options: UploadApiOptions) =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) =>
      error || !result ? reject(new Error(`Cloudinary upload failed: ${error?.message ?? "no result"}`)) : resolve(result),
    );
    stream.end(buffer);
  });

export const cloudinaryAdapter =
  (opts: CloudinaryAdapterOptions): Adapter =>
  ({ collection }): GeneratedAdapter => {
    const filePath = (filename: string) => `/api/${collection.slug}/file/${encodeURIComponent(filename)}`;

    /** Looks up the stored asset for a filename. Payload has already checked collection read access. */
    const findByFilename = async (req: PayloadRequest, filename: string): Promise<StoredAsset | null> => {
      const { docs } = await req.payload.find({
        collection: collection.slug as "media",
        where: { filename: { equals: filename } },
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: true,
        req,
      });
      return (docs[0] as StoredAsset | undefined) ?? null;
    };

    return {
      name: `cloudinary-${opts.delivery}`,
      fields: assetFields(opts.delivery),

      async handleUpload({ file }) {
        // Image sizes are not used with Cloudinary (it resizes on delivery); only the original is stored.
        if (file.imageSizeName) return {};
        const raw = file.buffer.length === 0 && file.tempFilePath ? await readFile(file.tempFilePath) : file.buffer;
        // Second line of defence: files added by URL are fetched after the beforeOperation hook ran.
        const buffer = await cleanUploadBuffer(raw, file.mimeType, { force: false });
        const result = await uploadBuffer(buffer, uploadOptionsFor(opts, file));
        return {
          cloudinaryPublicId: result.public_id,
          cloudinaryResourceType: result.resource_type,
          cloudinaryFormat: result.format ?? "",
        } as unknown as Partial<FileData & TypeWithID>; // extra fields, saved by the plugin
      },

      async handleDelete({ doc }) {
        const asset = doc as unknown as StoredAsset;
        if (!asset.cloudinaryPublicId) return;
        await cloudinary.uploader.destroy(asset.cloudinaryPublicId, {
          resource_type: asset.cloudinaryResourceType || "image",
          type: opts.delivery === "private" ? INTAKE_DELIVERY_TYPE : "upload",
          invalidate: true,
        });
      },

      // Only used for public delivery (disablePayloadAccessControl). Private files never get a Cloudinary URL.
      generateURL({ data, filename }) {
        if (opts.delivery === "private" || !data?.cloudinaryPublicId) return filePath(filename);
        return publicDeliveryUrl(opts.cloudName, data as StoredAsset);
      },

      async staticHandler(req, { params }) {
        if (opts.delivery === "private") return respondWithSignedIntakeUrl(req, { filename: params.filename }, "redirect");
        const asset = await findByFilename(req, params.filename);
        if (!asset?.cloudinaryPublicId) return new Response("Not found", { status: 404 });
        return new Response(null, {
          status: 302,
          headers: { Location: publicDeliveryUrl(opts.cloudName, asset), "Cache-Control": "private, max-age=300" },
        });
      },
    };
  };
