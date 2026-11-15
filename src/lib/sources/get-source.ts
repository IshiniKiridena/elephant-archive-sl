import type { Payload } from "payload";
import type { Locale } from "@/i18n/config";
import type { Shown } from "@/i18n/fallback";
import { canPreview } from "@/lib/preview";
import { SLUG_PATTERN } from "@/lib/slug";
import type { Source } from "@/payload-types";

/**
 * Data for the public Source page.
 * - Visitors get published sources only. Payload's access control (publishedOrStaff) applies to
 *   every query, and a result that isn't published is dropped again here.
 * - Drafts only when draft mode is on AND the request has a staff login (canPreview). Next's draft
 *   cookie alone is not enough: it isn't tied to a person.
 * - Only public fields are read. `notes` (internal) never leaves the database.
 */

export const PUBLIC_SOURCE_FIELDS = [
  "title",
  "slug",
  "publisher",
  "date",
  "url",
  "archiveUrl",
  "language",
  "sourceType",
  "verificationStatus",
  "linkStatus",
  "accessedAt",
  "_status",
] as const satisfies readonly (keyof Source)[];

export type PublicSource = Pick<Source, "id" | (typeof PUBLIC_SOURCE_FIELDS)[number]>;

const SELECT = Object.fromEntries(PUBLIC_SOURCE_FIELDS.map((f) => [f, true])) as Record<(typeof PUBLIC_SOURCE_FIELDS)[number], true>;

type Finder = Pick<Payload, "find">;

export async function getSourceForPage(
  payload: Finder,
  slug: string,
  { draft = false, user = null }: { draft?: boolean; user?: unknown } = {},
): Promise<PublicSource | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const preview = draft && canPreview(user);

  const { docs } = await payload.find({
    collection: "sources",
    where: preview ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
    draft: preview, // latest draft for staff; otherwise the published row
    overrideAccess: false,
    ...(preview ? { user: user as never } : {}),
    select: SELECT,
    depth: 0,
    limit: 1,
    pagination: false,
  });
  const doc = docs[0] as PublicSource | undefined;
  if (!doc) return null;
  if (!preview && doc._status !== "published") return null;
  return doc;
}

/** Published slugs for generateStaticParams. */
export async function publishedSourceSlugs(payload: Finder): Promise<string[]> {
  const { docs } = await payload.find({
    collection: "sources",
    where: { and: [{ _status: { equals: "published" } }, { slug: { exists: true } }] },
    select: { slug: true },
    overrideAccess: false,
    depth: 0,
    pagination: false,
  });
  return docs.map((d) => d.slug).filter((s): s is string => !!s && SLUG_PATTERN.test(s));
}

/** One record (death, life event, court case, fact…) that cites a source, ready to list. */
export interface CitingRecord {
  key: string;
  href: string;
  /** Kind of record in the page's language, e.g. "Elephant death". */
  kind: string;
  title: Shown<string | null>;
  meta?: string | null;
  sourceType?: Source["sourceType"];
  verificationStatus?: Source["verificationStatus"];
}

/**
 * Records that cite this source. None exist yet: Deaths, Elephants, Court cases and the other
 * record collections arrive in Phase 1.
 * TODO(phase-1): query each record collection's `sources` relationship (published only), pick
 * titles with pickLocalized(), and return them here. The page's TranslationNote is driven by these.
 */
export async function citingRecords(_payload: Finder, _sourceId: PublicSource["id"], _locale: Locale): Promise<CitingRecord[]> {
  return [];
}
