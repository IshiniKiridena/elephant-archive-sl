import { revalidatePath, revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  PayloadRequest,
} from "payload";
import { LOCALES } from "../i18n/config";

/**
 * Refreshes static public pages when what visitors can see changes. Pages are statically generated;
 * this tells Next to rebuild them on the next request.
 *
 * Runs when a doc becomes published, stops being published, changes while published, or is
 * deleted while published. Saving a draft (new, or over a published version) changes nothing
 * public, so it does nothing.
 *
 *   const revalidate = revalidateOnPublish({ paths: (d) => [`/sources/${d.slug}`, "/sources"], tags: ["sources"] });
 *   hooks: {
 *     beforeChange: [revalidate.beforeChange],
 *     afterChange: [auditChange, revalidate.afterChange],
 *     afterDelete: [auditDelete, revalidate.afterDelete],
 *   }
 *
 * Why beforeChange too: Payload passes afterChange no draft flag, and its previousDoc is the latest
 * *version* (often a draft), not what visitors see. So beforeChange reads the published row first;
 * afterChange compares it with the row after the save. That also gives the old slug, so a renamed
 * page's old URL is refreshed (it then 404s instead of going stale). The hand-over is keyed on the
 * request object, not `context`: every nested local API call with `req` (this hook's own read, the
 * audit log's create) replaces req.context with a copy, so a value written there doesn't reach
 * afterChange.
 *
 * Paths are given without a locale; each is revalidated under /si, /ta and /en. Include listing
 * pages that show the doc. Set `context.disableRevalidate` in scripts and seeds to skip it.
 * Outside a Next request (pnpm ingest, scripts) Next's revalidate functions throw: that is logged
 * and the save still succeeds.
 */

type StatusDoc = { id: string | number; _status?: "draft" | "published" | null } & Record<string, unknown>;
type PathList = (string | null | undefined | false)[];

export type RevalidateOptions<D extends StatusDoc> = {
  /** Locale-less paths showing this doc, e.g. `(d) => [`/sources/${d.slug}`, "/sources"]`. */
  paths: PathList | ((doc: D) => PathList);
  /** Cache tags to expire (revalidateTag with the "max" profile, Next 16). */
  tags?: string[];
};

const isPublished = (d: unknown) => (d as StatusDoc | null | undefined)?._status === "published";

export function revalidateOnPublish<D extends StatusDoc = StatusDoc>({ paths, tags = [] }: RevalidateOptions<D>) {
  const pathsOf = (doc: D): string[] =>
    (typeof paths === "function" ? paths(doc) : paths).filter((p): p is string => typeof p === "string" && p.startsWith("/"));

  /** Every locale-prefixed path for these docs, deduplicated. */
  const localized = (docs: D[]) => {
    const out = new Set<string>();
    for (const d of docs) for (const p of pathsOf(d)) for (const l of LOCALES) out.add(p === "/" ? `/${l}` : `/${l}${p}`);
    return [...out];
  };

  const revalidate = (req: PayloadRequest, docs: D[]) => {
    const list = localized(docs);
    try {
      for (const p of list) revalidatePath(p);
      for (const t of tags) revalidateTag(t, "max");
    } catch (err) {
      req.payload.logger.warn({ err, msg: `revalidateOnPublish: could not revalidate ${list.join(", ")} (not inside a Next request?)` });
    }
  };

  /** The row visitors see (draft: false), or null. */
  const publicRow = async (req: PayloadRequest, collection: string, id: StatusDoc["id"]) =>
    (await req.payload.findByID({
      collection: collection as CollectionSlug,
      id,
      draft: false,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
      req,
    })) as D | null;

  type Before = { published: boolean; row: D | null };
  /** Published state before each save, per request; freed with the request. */
  const pending = new WeakMap<object, Map<string, Before>>();
  const key = (collection: string, id: unknown) => `${collection}:${String(id)}`;
  const take = (req: PayloadRequest, k: string) => {
    const m = pending.get(req);
    const v = m?.get(k);
    m?.delete(k);
    return v;
  };

  const beforeChange: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req, context, collection }) => {
    if (operation !== "update" || context?.disableRevalidate || !originalDoc?.id) return data;
    try {
      const row = await publicRow(req, collection.slug, originalDoc.id);
      const m = pending.get(req) ?? new Map<string, Before>();
      m.set(key(collection.slug, originalDoc.id), { published: isPublished(row), row });
      pending.set(req, m);
    } catch (err) {
      req.payload.logger.warn({ err, msg: `revalidateOnPublish: could not read ${collection.slug} ${originalDoc.id} before saving` });
    }
    return data;
  };

  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req, context, collection }) => {
    const recorded = take(req, key(collection.slug, doc.id));
    if (context?.disableRevalidate) return doc;
    // Without beforeChange (or on create) fall back to previousDoc's status
    const before = recorded ?? { published: isPublished(previousDoc), row: null };

    try {
      if (isPublished(doc)) {
        // Published, or changed while published: the new page, plus the old one if the slug moved
        revalidate(req, [doc as D, ...(before.row && before.published ? [before.row] : [])]);
      } else if (before.published) {
        // Draft over the published version (row still published: nothing public changed) or Unpublish
        const row = await publicRow(req, collection.slug, doc.id);
        if (!isPublished(row)) revalidate(req, [doc as D, ...(before.row ? [before.row] : [])]);
      }
      // draft → draft: nothing public changed
    } catch (err) {
      req.payload.logger.warn({ err, msg: `revalidateOnPublish: skipped for ${collection.slug} ${doc.id}` });
    }
    return doc;
  };

  const afterDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
    if (!context?.disableRevalidate && isPublished(doc)) revalidate(req, [doc as D]);
    return doc;
  };

  return { beforeChange, afterChange, afterDelete };
}
