// @vitest-environment node
/**
 * Drafts, publishing and revalidation against the real database (DATABASE_URL in .env).
 * Creates one clearly fake "Example source" and deletes it again. Its AuditLog rows stay
 * (the log is append-only), so run this only against a dev database.
 * next/cache is mocked: outside a Next server there is nothing to revalidate, but the calls show
 * what would be refreshed.
 */
import { getPayload, type Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => cache);

import config from "@/payload.config";
import { getSourceForPage } from "@/lib/sources/get-source";

const token = Math.random().toString(36).slice(2, 8);
const editor = { id: 0, collection: "users", roles: ["editor"] };
let payload: Payload;
let id: number;
let slug: string;

const paths = () => cache.revalidatePath.mock.calls.map((c) => c[0] as string).sort();

describe("Source drafts and publishing (DB)", { timeout: 60_000 }, () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config });
    const doc = await payload.create({
      collection: "sources",
      draft: true,
      overrideAccess: true,
      data: { title: `[Example source ${token}, test only]`, url: `https://example.org/test-${token}`, _status: "draft" },
    });
    id = doc.id;
    slug = doc.slug!;
  }, 60_000);

  afterAll(async () => {
    if (id) await payload.delete({ collection: "sources", id, overrideAccess: true });
  });

  beforeEach(() => cache.revalidatePath.mockClear());

  it("gives a new source a slug from its title", () => {
    expect(slug).toMatch(new RegExp(`^example-source-${token}-test-only(-\\d+)?$`));
  });

  it("a draft never shows without draft mode, and shows in draft mode for staff", async () => {
    expect(await getSourceForPage(payload, slug)).toBeNull();
    expect(await getSourceForPage(payload, slug, { draft: true, user: null })).toBeNull();
    expect((await getSourceForPage(payload, slug, { draft: true, user: editor }))?.title).toContain(token);
  });

  it("saving the draft does not revalidate anything", async () => {
    await payload.update({ collection: "sources", id, draft: true, overrideAccess: true, data: { publisher: "Example Publisher" } });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("publishing makes it public and revalidates it in all three locales", async () => {
    await payload.update({
      collection: "sources",
      id,
      overrideAccess: true,
      data: { _status: "published", sourceType: "news", verificationStatus: "single_source" },
    });
    expect((await getSourceForPage(payload, slug))?._status).toBe("published");
    expect(paths()).toEqual(expect.arrayContaining(["si", "ta", "en"].map((l) => `/${l}/sources/${slug}`)));
    expect(paths()).toEqual(expect.arrayContaining(["/si/sources", "/ta/sources", "/en/sources"]));
  });

  it("a draft saved over the published version stays private and revalidates nothing", async () => {
    await payload.update({ collection: "sources", id, draft: true, overrideAccess: true, data: { title: `[Example draft title ${token}]` } });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    expect((await getSourceForPage(payload, slug))?.title).toBe(`[Example source ${token}, test only]`);
    expect((await getSourceForPage(payload, slug, { draft: true, user: editor }))?.title).toBe(`[Example draft title ${token}]`);
  });

  it("unpublishing hides it and revalidates", async () => {
    await payload.update({ collection: "sources", id, overrideAccess: true, data: { _status: "draft" } });
    expect(await getSourceForPage(payload, slug)).toBeNull();
    expect(paths()).toContain(`/en/sources/${slug}`);
  });
});
