import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";
import { adminsOnly, staff } from "../access/roles";
import { SOURCE_TYPES, TARGETS } from "../pipeline/types";

/**
 * Intake: "drop in anything you found". One batch can hold pasted text, links,
 * screenshots and files. Run `pnpm ingest` to process queued batches.
 */
export const IntakeBatches: CollectionConfig = {
  slug: "intake-batches",
  labels: { singular: "Intake batch", plural: "Intake" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "createdAt"],
    description: "Paste a post or article, add links, screenshots or files. You don't need to sort anything; the pipeline finds every record in it.",
    group: "Fact-check pipeline",
  },
  access: { read: staff, create: staff, update: staff, delete: adminsOnly },
  fields: [
    { name: "title", type: "text", required: true, admin: { placeholder: "e.g. News article on train collision, Oct 2026" } },
    {
      name: "text",
      type: "textarea",
      admin: { description: "Paste the post, article text, transcript or your notes. Social posts: paste the text here, links to them often can't be read automatically." },
    },
    {
      name: "urls",
      type: "array",
      labels: { singular: "Link", plural: "Links" },
      fields: [{ name: "url", type: "text", required: true }],
    },
    {
      name: "files",
      type: "upload",
      relationTo: "intake-files",
      hasMany: true,
      admin: { description: "Screenshots, photos of documents, PDF, CSV, TXT. Kept private as evidence, never published." },
    },
    {
      type: "collapsible",
      label: "Optional details",
      admin: { initCollapsed: true },
      fields: [
        { name: "defaultSourceType", type: "select", options: [...SOURCE_TYPES] },
        { name: "hintTarget", type: "select", options: [...TARGETS], admin: { description: "Required for offline CSV ingest" } },
        { name: "providedBy", type: "text" },
        { name: "notes", type: "textarea" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "queued",
      options: ["queued", "processing", "done", "failed"],
      admin: { position: "sidebar", readOnly: true },
    },
    { name: "log", type: "textarea", admin: { position: "sidebar", readOnly: true } },
  ],
};

/** Folder for intake evidence in local development (git-ignored). Production uses private cloud storage. */
export const INTAKE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.intake-files");

/** Private evidence uploads. Configure the storage adapter to keep this collection non-public. */
export const IntakeFiles: CollectionConfig = {
  slug: "intake-files",
  admin: { group: "Fact-check pipeline", hidden: true },
  access: { read: staff, create: staff, update: staff, delete: adminsOnly },
  upload: {
    staticDir: INTAKE_DIR,
    // CSV is reported differently by browsers/OSes (Windows often says vnd.ms-excel), so all variants are allowed
    mimeTypes: [
      "image/*",
      "application/pdf",
      "text/csv",
      "application/csv",
      "text/x-csv",
      "application/vnd.ms-excel",
      "text/plain",
      "text/markdown",
      "text/x-markdown",
    ],
  },
  fields: [],
};
