import { auditChange, auditDelete } from "./AuditLog";
import type { CollectionConfig } from "payload";
import { adminsOnly, staff } from "../access/roles";
import { publishedOrStaff, translationReviewField } from "../fields/evidence";
import { stripUploadMetadata } from "../storage/strip-metadata";

/**
 * Photos and short clips shown on the site (long video goes to YouTube; see tech-stack.md).
 * Rule 6: every image records credit and permission before it can be published.
 * No EXIF location is kept: GPS metadata in a photo would leak an exact location (rule 5).
 * `stripUploadMetadata` re-encodes every image before it is stored (Payload's `withMetadata`
 * alone does not touch the original), and refuses videos that carry GPS.
 * Stored on Cloudinary in production; sizes are made on delivery by the next/image loader.
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { useAsTitle: "alt", defaultColumns: ["filename", "alt", "credit", "permission", "_status"], group: "Archive" },
  hooks: { beforeOperation: [stripUploadMetadata], afterChange: [auditChange], afterDelete: [auditDelete] },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: adminsOnly },
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"],
    withMetadata: false, // belt and braces for anything Payload re-encodes itself
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      localized: true,
      admin: { description: "Describe what is in the picture for someone who can't see it. Calm, no graphic detail." },
    },
    { name: "caption", type: "textarea", localized: true },
    {
      type: "row",
      fields: [
        { name: "credit", type: "text", admin: { width: "50%", description: "Photographer / owner, as they want to be credited" } },
        {
          name: "licence",
          type: "select",
          admin: { width: "50%" },
          options: [
            { label: "Our own", value: "own" },
            { label: "Used with written permission", value: "permission" },
            { label: "Creative Commons BY", value: "cc_by" },
            { label: "Creative Commons BY-SA", value: "cc_by_sa" },
            { label: "Public domain", value: "public_domain" },
            { label: "Unknown", value: "unknown" },
          ],
        },
      ],
    },
    {
      name: "permission",
      type: "select",
      defaultValue: "not_requested",
      options: [
        { label: "Not requested", value: "not_requested" },
        { label: "Requested, waiting", value: "requested" },
        { label: "Granted", value: "granted" },
        { label: "Not needed (own / CC / public domain)", value: "not_needed" },
        { label: "Refused", value: "refused" },
      ],
      validate: (v: unknown, { data }: { data: Record<string, unknown> }) =>
        data?._status !== "published" ||
        ((v === "granted" || v === "not_needed") && !!data?.credit) ||
        "Before publishing: permission must be Granted or Not needed, and credit filled in",
    },
    { name: "permissionNote", type: "textarea", admin: { description: "Who gave permission, when, how (email/WhatsApp). Not public." }, access: { read: ({ req }) => !!req.user } },
    { name: "sourceUrl", type: "text", admin: { description: "Where the original came from" } },
    { name: "shareAllowed", type: "checkbox", defaultValue: false, admin: { description: "Permission also covers share cards and social posts" } },
    {
      name: "sensitive",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Distressing content (e.g. an injury). Never shown on Quiet pages or share cards. Images of remains are not uploaded at all." },
    },
    translationReviewField(),
  ],
};
