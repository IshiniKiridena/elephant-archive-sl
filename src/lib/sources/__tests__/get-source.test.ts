import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";
import { getSourceForPage, publishedSourceSlugs } from "../get-source";

// Clearly fake data only.
const published = { id: 1, slug: "example-source", title: "[Example published title]", _status: "published" as const };
const draft = { id: 1, slug: "example-source", title: "[Example draft title]", _status: "draft" as const };
const editor = { id: 2, roles: ["editor"] };

/** A fake Payload whose find() returns `doc` whatever it's asked, so the guards are what's tested. */
function fakePayload(doc: unknown) {
  const find = vi.fn(async () => ({ docs: doc ? [doc] : [] }));
  return { payload: { find } as unknown as Pick<Payload, "find">, find };
}
const argsOf = (find: ReturnType<typeof fakePayload>["find"]) => (find.mock.calls[0] as unknown[])[0] as Record<string, unknown>;

describe("getSourceForPage: a draft never shows without draft mode", () => {
  it("asks for the published row only, with access control on", async () => {
    const { payload, find } = fakePayload(published);
    expect(await getSourceForPage(payload, "example-source")).toEqual(published);
    const a = argsOf(find);
    expect(a.draft).toBe(false);
    expect(a.overrideAccess).toBe(false);
    expect(a.user).toBeUndefined();
    expect(JSON.stringify(a.where)).toContain('"_status":{"equals":"published"}');
  });

  it("drops a draft even if the query returned one", async () => {
    const { payload } = fakePayload(draft);
    expect(await getSourceForPage(payload, "example-source")).toBeNull();
  });

  it("ignores a staff login when draft mode is off", async () => {
    const { payload, find } = fakePayload(draft);
    expect(await getSourceForPage(payload, "example-source", { draft: false, user: editor })).toBeNull();
    expect(argsOf(find).draft).toBe(false);
  });

  it.each([
    ["no login", null],
    ["a user without a staff role", { id: 5, roles: [] }],
  ])("treats draft mode with %s as published-only (the draft cookie alone isn't enough)", async (_, user) => {
    const { payload, find } = fakePayload(draft);
    expect(await getSourceForPage(payload, "example-source", { draft: true, user })).toBeNull();
    expect(argsOf(find).draft).toBe(false);
  });

  it("shows the latest draft in draft mode with a staff login, using that user's access", async () => {
    const { payload, find } = fakePayload(draft);
    expect(await getSourceForPage(payload, "example-source", { draft: true, user: editor })).toEqual(draft);
    const a = argsOf(find);
    expect(a.draft).toBe(true);
    expect(a.overrideAccess).toBe(false);
    expect(a.user).toBe(editor);
  });

  it("never reads internal notes", async () => {
    const { payload, find } = fakePayload(published);
    await getSourceForPage(payload, "example-source");
    expect(Object.keys(argsOf(find).select as object)).not.toContain("notes");
  });

  it("doesn't query for a malformed slug", async () => {
    const { payload, find } = fakePayload(published);
    expect(await getSourceForPage(payload, "../admin")).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });
});

describe("publishedSourceSlugs", () => {
  it("lists published slugs only", async () => {
    const find = vi.fn(async () => ({ docs: [{ slug: "example-a" }, { slug: null }, { slug: "Bad Slug" }] }));
    expect(await publishedSourceSlugs({ find } as unknown as Pick<Payload, "find">)).toEqual(["example-a"]);
    expect(JSON.stringify((find.mock.calls[0] as unknown[])[0])).toContain('"_status":{"equals":"published"}');
  });
});
