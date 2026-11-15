import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => cache);

import { revalidateOnPublish } from "../revalidateOnPublish";

type Doc = { id: number; slug?: string | null; _status?: "draft" | "published" | null };
const hooks = revalidateOnPublish<Doc>({ paths: (d) => [d.slug && `/sources/${d.slug}`, "/sources"], tags: ["sources"] });

// Clearly fake docs.
const pub = (over: Partial<Doc> = {}): Doc => ({ id: 1, slug: "example-source", _status: "published", ...over });
const drf = (over: Partial<Doc> = {}): Doc => ({ id: 1, slug: "example-source", _status: "draft", ...over });
const collection = { slug: "sources", versions: { drafts: true } } as never;

/**
 * One save as Payload runs it: beforeChange, then afterChange, sharing one context.
 *  rowBefore / rowAfter: the published (main) row before and after the save, as findByID(draft: false) returns it.
 *  doc / previousDoc: what Payload hands afterChange (previousDoc is the latest version, often a draft).
 */
async function save(s: { rowBefore?: Doc | null; rowAfter?: Doc | null; doc: Doc; previousDoc?: Doc; context?: Record<string, unknown> }) {
  const findByID = vi.fn().mockResolvedValueOnce(s.rowBefore ?? null).mockResolvedValue(s.rowAfter ?? null);
  const warn = vi.fn();
  const req = { payload: { findByID, logger: { warn } } } as unknown as PayloadRequest;
  const context = s.context ?? {};
  const operation = s.previousDoc ? "update" : "create";
  // Payload hands afterChange a different context object: the hook's own findByID (a nested local
  // API call with req) replaces req.context with a copy before beforeChange can write to it.
  const afterContext = { ...context };
  if (operation === "update") {
    await hooks.beforeChange({ data: s.doc, originalDoc: s.previousDoc, operation, req, context, collection } as never);
  }
  const result = await hooks.afterChange({ doc: s.doc, previousDoc: s.previousDoc ?? {}, req, context: afterContext, collection, operation, data: s.doc } as never);
  return { result, warn, findByID };
}
const remove = (doc: Doc, context: Record<string, unknown> = {}) =>
  hooks.afterDelete({ doc, req: { payload: { logger: { warn: vi.fn() } } } as never, context, collection, id: doc.id } as never);

const paths = () => cache.revalidatePath.mock.calls.map((c) => c[0]).sort();
const ALL = ["/en/sources", "/en/sources/example-source", "/si/sources", "/si/sources/example-source", "/ta/sources", "/ta/sources/example-source"];

beforeEach(() => {
  cache.revalidatePath.mockReset();
  cache.revalidateTag.mockReset();
});

describe("revalidateOnPublish: publishing triggers revalidation for all three locales", () => {
  it("revalidates the page and the listing under /si, /ta and /en when a draft is published", async () => {
    await save({ rowBefore: drf(), rowAfter: pub(), doc: pub(), previousDoc: drf() });
    expect(paths()).toEqual(ALL);
    expect(cache.revalidateTag).toHaveBeenCalledWith("sources", "max");
  });

  it("does the same when a doc is created already published", async () => {
    await save({ doc: pub() });
    expect(paths()).toEqual(ALL);
  });

  it("revalidates when a published doc changes", async () => {
    await save({ rowBefore: pub(), rowAfter: pub(), doc: pub(), previousDoc: pub() });
    expect(paths()).toEqual(ALL);
  });

  it("revalidates when a doc is unpublished", async () => {
    await save({ rowBefore: pub(), rowAfter: drf(), doc: drf(), previousDoc: pub() });
    expect(paths()).toEqual(ALL);
  });

  it("revalidates an Unpublish that follows a draft save (previousDoc is then a draft too)", async () => {
    await save({ rowBefore: pub(), rowAfter: drf(), doc: drf(), previousDoc: drf() });
    expect(paths()).toEqual(ALL);
  });

  it("does nothing when a draft is saved over the published version (visitors still see the published one)", async () => {
    await save({ rowBefore: pub(), rowAfter: pub(), doc: drf(), previousDoc: pub() });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    expect(cache.revalidateTag).not.toHaveBeenCalled();
  });

  it("does nothing for draft-only saves", async () => {
    await save({ doc: drf() });
    await save({ rowBefore: drf(), rowAfter: drf(), doc: drf(), previousDoc: drf() });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("also revalidates the old URL when a published slug changed, so it stops serving the old page", async () => {
    await save({ rowBefore: pub({ slug: "example-old" }), rowAfter: pub({ slug: "example-new" }), doc: pub({ slug: "example-new" }), previousDoc: drf({ slug: "example-new" }) });
    expect(paths()).toEqual(expect.arrayContaining(["/si/sources/example-old", "/ta/sources/example-old", "/en/sources/example-old", "/en/sources/example-new"]));
  });

  it("revalidates when a published doc is deleted, not a draft", async () => {
    await remove(drf());
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    await remove(pub());
    expect(paths()).toEqual(ALL);
  });

  it("skips when the save asks it to (scripts, seeds), without reading the database", async () => {
    const { findByID } = await save({ rowBefore: drf(), doc: pub(), previousDoc: drf(), context: { disableRevalidate: true } });
    await remove(pub(), { disableRevalidate: true });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    expect(findByID).not.toHaveBeenCalled();
  });

  it("never fails the save when Next can't revalidate (outside a Next request)", async () => {
    cache.revalidatePath.mockImplementation(() => {
      throw new Error("Invariant: static generation store missing");
    });
    const doc = pub();
    const { result, warn } = await save({ rowBefore: drf(), rowAfter: doc, doc, previousDoc: drf() });
    expect(result).toBe(doc);
    expect(warn).toHaveBeenCalled();
  });
});
