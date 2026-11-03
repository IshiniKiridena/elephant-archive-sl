import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from "payload";
import { hasRole, nobody } from "../access/roles";

/**
 * Who did what, when. Payload's versions keep the content history; this log answers
 * "who published / changed / deleted this record?" across all content collections in one list.
 * Stores field NAMES only, never values, so it stays small and holds no copied content.
 * Append-only: nobody can edit or delete entries through the admin or API.
 */
export const AuditLog: CollectionConfig = {
  slug: "audit-log",
  admin: {
    group: "Admin",
    defaultColumns: ["createdAt", "action", "collectionSlug", "docId", "user"],
    description: "Append-only record of changes to archive content",
  },
  access: { read: ({ req }) => hasRole(req.user), create: nobody, update: nobody, delete: nobody },
  timestamps: true,
  fields: [
    {
      name: "action",
      type: "select",
      required: true,
      options: ["create", "update", "publish", "delete"],
      index: true,
    },
    { name: "collectionSlug", type: "text", required: true, index: true },
    { name: "docId", type: "text", required: true, index: true },
    { name: "user", type: "relationship", relationTo: "users", admin: { description: "Empty = the pipeline or a script" } },
    { name: "changedFields", type: "json" },
  ],
};

const IGNORED = new Set(["updatedAt", "createdAt", "_status", "id"]);

/** Relationships arrive either as IDs or as populated objects; compare them by ID only. */
const norm = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(norm)
  : v && typeof v === "object" && "id" in v ? (v as { id: unknown }).id
  : v;

const changedFieldNames = (doc: Record<string, unknown>, prev: Record<string, unknown> | undefined) =>
  Object.keys(doc).filter(
    (k) => !IGNORED.has(k) && (!prev || JSON.stringify(norm(doc[k])) !== JSON.stringify(norm(prev[k]))),
  );

/** Add to a content collection: hooks: { afterChange: [auditChange], afterDelete: [auditDelete] } */
export const auditChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, collection }) => {
  // "publish" = this save made the doc published when it wasn't before; everything else is create/update
  const becamePublished = doc?._status === "published" && (operation === "create" || previousDoc?._status !== "published");
  const action = becamePublished ? "publish" : operation === "create" ? "create" : "update";

  // Autosaved drafts of an already-draft doc would flood the log; record the first and real saves only
  const fields = changedFieldNames(doc, operation === "create" ? undefined : previousDoc);
  if (action === "update" && fields.length === 0) return doc;

  await req.payload.create({
    collection: "audit-log",
    data: { action, collectionSlug: collection.slug, docId: String(doc.id), user: req.user?.id ?? null, changedFields: fields },
    req, // same transaction: if the change rolls back, so does its log entry
    overrideAccess: true,
  });
  return doc;
};

export const auditDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  await req.payload.create({
    collection: "audit-log",
    data: { action: "delete", collectionSlug: collection.slug, docId: String(doc.id), user: req.user?.id ?? null, changedFields: [] },
    req,
    overrideAccess: true,
  });
  return doc;
};
