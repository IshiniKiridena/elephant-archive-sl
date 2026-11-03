import { auditChange, auditDelete } from "./AuditLog";
import type { CollectionConfig } from "payload";
import { adminsOnly, staff } from "../access/roles";
import { labelFields, publishedOrStaff } from "../fields/evidence";
import { looseDateField } from "../fields/looseDate";

/**
 * One row per article, document, post, court record or report the archive relies on.
 * A source carries its own source type. Its verification status describes the source itself
 * (e.g. a post later deleted or contradicted), while each record carries its own labels too.
 * Never store copied article text here (rule 7): title, publisher, date, links and our notes only.
 */
export const Sources: CollectionConfig = {
  slug: "sources",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publisher", "date", "sourceType", "_status"],
    group: "Archive",
    description: "Articles, documents, posts and records the archive cites. Titles and links only, never copied text.",
  },
  hooks: { afterChange: [auditChange], afterDelete: [auditDelete] },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: adminsOnly },
  fields: [
    { name: "title", type: "text", required: true, admin: { description: "Title as published, in its original language" } },
    {
      type: "row",
      fields: [
        { name: "publisher", type: "text", admin: { width: "50%", description: "Outlet, agency, court or account" } },
        looseDateField("date", "Published", false, "50%"),
      ],
    },
    {
      name: "url",
      type: "text",
      unique: true,
      index: true,
      admin: { description: "Leave empty for print or offline sources" },
      validate: (v: unknown) => !v || /^https?:\/\/\S+$/i.test(String(v)) || "Must start with http:// or https://",
    },
    { name: "archiveUrl", type: "text", admin: { description: "Wayback Machine or other saved copy, in case the original disappears" } },
    {
      name: "language",
      type: "select",
      options: [
        { label: "Sinhala", value: "si" },
        { label: "Tamil", value: "ta" },
        { label: "English", value: "en" },
        { label: "Other", value: "other" },
      ],
    },
    ...labelFields(),
    {
      name: "linkStatus", // not "status": that name clashes with Payload's draft status in Postgres
      type: "select",
      defaultValue: "live",
      options: [
        { label: "Live", value: "live" },
        { label: "Removed by publisher", value: "removed" },
        { label: "Unreachable", value: "unreachable" },
        { label: "Corrected by publisher", value: "corrected" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "accessedAt", type: "date", admin: { position: "sidebar", description: "When someone last confirmed the link" } },
    { name: "notes", type: "textarea", admin: { description: "Internal notes in your own words. Not public." }, access: { read: ({ req }) => !!req.user } },
  ],
};
