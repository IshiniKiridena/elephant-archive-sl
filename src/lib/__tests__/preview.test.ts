import { describe, expect, it, vi } from "vitest";
import { canPreview, checkPreviewSecret, exitPreviewTarget, handleEnablePreview, previewUrl, safePreviewPath } from "../preview";

// Fake secret; nothing here is sent anywhere.
const SECRET = "example-preview-secret-not-real";
const users = {
  anonymous: null,
  noRoles: { id: 5, roles: [] },
  unknownRole: { id: 6, roles: ["visitor"] },
  editor: { id: 2, roles: ["editor"] },
  reviewer: { id: 3, roles: ["reviewer"] },
  legal: { id: 4, roles: ["legal"] },
  admin: { id: 1, roles: ["admin"] },
};

const req = (query: Record<string, string>) => new Request(`https://archive.example.org/next/preview?${new URLSearchParams(query)}`);

function run(user: unknown, query: Record<string, string>, secret: string | undefined) {
  const enable = vi.fn();
  const getUser = vi.fn(async () => user);
  return { enable, getUser, res: handleEnablePreview(req(query), { secret, getUser, enable }) };
}

describe("canPreview (access function)", () => {
  it.each(["anonymous", "noRoles", "unknownRole"] as const)("refuses %s", (who) => {
    expect(canPreview(users[who])).toBe(false);
  });
  it.each(["editor", "reviewer", "legal", "admin"] as const)("allows %s", (who) => {
    expect(canPreview(users[who])).toBe(true);
  });
});

describe("GET /next/preview: a non-editor can't enable draft mode", () => {
  const ok = { secret: SECRET, path: "/en/sources/example-source" };

  it.each(["anonymous", "noRoles", "unknownRole"] as const)("refuses %s with the right secret, and never enables draft mode", async (who) => {
    const { res, enable } = run(users[who], ok, SECRET);
    expect((await res).status).toBe(who === "anonymous" ? 401 : 403);
    expect((await res).headers.get("Location")).toBeNull();
    expect(enable).not.toHaveBeenCalled();
  });

  it.each([
    ["a wrong secret", { ...ok, secret: "guess" }, SECRET],
    ["no secret", { path: ok.path }, SECRET],
    ["preview not configured (no PREVIEW_SECRET)", ok, undefined],
    ["an empty PREVIEW_SECRET", { ...ok, secret: "" }, ""],
  ] as const)("refuses an admin with %s, before looking up the user", async (_, query, secret) => {
    const { res, enable, getUser } = run(users.admin, query, secret);
    expect((await res).status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
    expect(enable).not.toHaveBeenCalled();
  });

  it.each(["editor", "reviewer", "legal", "admin"] as const)("enables it for %s and redirects to the page", async (who) => {
    const { res, enable } = run(users[who], ok, SECRET);
    const r = await res;
    expect(r.status).toBe(307);
    expect(r.headers.get("Location")).toBe("/en/sources/example-source");
    expect(r.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(enable).toHaveBeenCalledOnce();
  });

  it.each(["si", "ta", "en"])("works for /%s", async (l) => {
    const { res } = run(users.editor, { ...ok, path: `/${l}/sources/example-source` }, SECRET);
    expect((await res).headers.get("Location")).toBe(`/${l}/sources/example-source`);
  });

  it.each(["//evil.example", "https://evil.example/en", "/fr/sources/x", "/en/../admin", "/en/sources/x?y=1", "/en//x", "", "en/sources/x"])(
    "refuses the path %j (no open redirect)",
    async (path) => {
      const { res, enable } = run(users.admin, { ...ok, path }, SECRET);
      expect((await res).status).toBe(400);
      expect(enable).not.toHaveBeenCalled();
    },
  );
});

describe("checkPreviewSecret", () => {
  it("matches only the exact secret", () => {
    expect(checkPreviewSecret(SECRET, SECRET)).toBe(true);
    expect(checkPreviewSecret(`${SECRET}x`, SECRET)).toBe(false);
    expect(checkPreviewSecret(SECRET, undefined)).toBe(false);
    expect(checkPreviewSecret(null, SECRET)).toBe(false);
  });
});

describe("previewUrl (admin Preview button)", () => {
  it("links to the page in the admin's locale", () => {
    const u = new URL(previewUrl("/sources/example-source", "ta", SECRET)!, "https://archive.example.org");
    expect(u.pathname).toBe("/next/preview");
    expect(u.searchParams.get("path")).toBe("/ta/sources/example-source");
    expect(u.searchParams.get("secret")).toBe(SECRET);
  });
  it("falls back to English for an unknown locale, and hides the button without a secret", () => {
    expect(new URL(previewUrl("/sources/x", "fr", SECRET)!, "https://a.example").searchParams.get("path")).toBe("/en/sources/x");
    expect(previewUrl("/sources/x", "en", "")).toBeNull();
  });
});

describe("exit preview", () => {
  const exit = (referer?: string) =>
    exitPreviewTarget(new Request("https://archive.example.org/next/exit-preview", { headers: referer ? { referer } : {} }));
  it("returns to the same page on this site", () => expect(exit("https://archive.example.org/si/sources/example")).toBe("/si/sources/example"));
  it("never follows another site's Referer", () => expect(exit("https://evil.example/en/sources/example")).toBe("/en"));
  it("defaults to /en", () => expect(exit()).toBe("/en"));
});

describe("safePreviewPath", () => {
  it("accepts locale home pages", () => expect(["/si", "/ta", "/en"].map(safePreviewPath)).toEqual(["/si", "/ta", "/en"]));
});
