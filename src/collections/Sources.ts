import { auditChange, auditDelete } from "./AuditLog";
import type { CollectionConfig, FieldHook } from "payload";
import { adminsOnly, staff } from "../access/roles";
import { labelFields, publishedOrStaff } from "../fields/evidence";
import { looseDateField } from "../fields/looseDate";
import { revalidateOnPublish } from "../hooks/revalidateOnPublish";
import { previewUrl } from "../lib/preview";
import { SLUG_MAX, SLUG_PATTERN, slugify, uniqueSlug } from "../lib/slug";

/** Public pages that show a source: its own page and (later) the Data & Sources listing, in si/ta/en. */
const revalidate = revalidateOnPublish<{ id: number | string; slug?: string | null }>({
  paths: (d) => [d.slug && `/sources/${d.slug}`, "/sources"],
  tags: ["sources"],
});

/** Fills an empty slug from the title, normalises a typed one, and adds -2, -3… if it's taken. */
const fillSlug: FieldHook = async ({ value, data, originalDoc, req }) => {
  const typed = typeof value === "string" && value.trim() ? value : null;
  // A partial update that doesn't send the slug keeps the existing one (never regenerated from a new title)
  if (!typed && originalDoc?.slug) return originalDoc.slug;
  const base = slugify(typed ?? data?.title ?? originalDoc?.title, "source");
  const id = originalDoc?.id ?? data?.id;
  return uniqueSlug(base, async (slug) => {
    const { totalDocs } = await req.payload.count({
      collection: "sources",
      where: id ? { and: [{ slug: { equals: slug } }, { id: { not_equals: id } }] } : { slug: { equals: slug } },
      overrideAccess: true,
      req,
    });
    return totalDocs > 0;
  });
};

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
    // Payload's Preview button: opens /<admin locale>/sources/<slug> in draft mode (staff only, see lib/preview.ts)
    preview: (doc, { locale }) => (typeof doc.slug === "string" && doc.slug ? previewUrl(`/sources/${doc.slug}`, locale) : null),
  },
  hooks: {
    beforeChange: [revalidate.beforeChange],
    afterChange: [auditChange, revalidate.afterChange],
    afterDelete: [auditDelete, revalidate.afterDelete],
  },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: adminsOnly },
  fields: [
    { name: "title", type: "text", required: true, admin: { description: "Title as published, in its original language" } },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      maxLength: SLUG_MAX,
      admin: {
        position: "sidebar",
        description:
          "Web address: /sources/<slug>. Filled from the title when empty (Sinhala and Tamil titles get \"source\"). Changing it on a published source changes its public link.",
      },
      hooks: { beforeValidate: [fillSlug] },
      validate: (v: unknown, { data }: { data: Record<string, unknown> }) =>
        (v ? SLUG_PATTERN.test(String(v)) : data?._status !== "published") || "Lowercase letters, numbers and hyphens only (needed before publishing)",
    },
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
