import { v2 as cloudinary } from "cloudinary";
import type { CollectionConfig, PayloadRequest } from "payload";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cloudinaryAdapter } from "../cloudinary-adapter";
import { INTAKE_URL_TTL_SECONDS, signIntakeUrl } from "../cloudinary-urls";
import { canGetSignedIntakeUrl, intakeSignedUrlEndpoint } from "../signed-intake-url";

// Fake credentials: signing is local maths, nothing is sent anywhere.
const CLOUD = "example-cloud";
const SECRET = "example-secret-not-real";
beforeAll(() => {
  process.env.CLOUDINARY_CLOUD_NAME = CLOUD;
  process.env.CLOUDINARY_API_KEY = "123456789012345";
  process.env.CLOUDINARY_API_SECRET = SECRET;
});
afterEach(() => vi.restoreAllMocks());

const STORED = { id: 7, filename: "screenshot.png", cloudinaryPublicId: "intake/0b0e8a52-6d1e-4c38-9a53-1f0c2f0b9a11", cloudinaryResourceType: "image", cloudinaryFormat: "png" };

const users = {
  anonymous: null,
  editor: { id: 2, roles: ["editor"] },
  reviewer: { id: 3, roles: ["reviewer"] },
  legal: { id: 4, roles: ["legal"] },
  noRoles: { id: 5, roles: [] },
  admin: { id: 1, roles: ["admin"] },
};

function fakeReq(user: unknown, doc: unknown = STORED) {
  const findByID = vi.fn(async () => doc);
  const find = vi.fn(async () => ({ docs: doc ? [doc] : [] }));
  const req = { user, routeParams: { id: "7" }, payload: { findByID, find } } as unknown as PayloadRequest;
  return { req, findByID, find };
}

describe("canGetSignedIntakeUrl (access function)", () => {
  it.each(["anonymous", "editor", "reviewer", "legal", "noRoles"] as const)("refuses %s", (who) => {
    expect(canGetSignedIntakeUrl(users[who])).toBe(false);
  });
  it("allows admins", () => {
    expect(canGetSignedIntakeUrl(users.admin)).toBe(true);
    expect(canGetSignedIntakeUrl({ id: 9, roles: ["editor", "admin"] })).toBe(true);
  });
});

describe("GET /api/intake-files/:id/signed-url", () => {
  it("refuses anonymous visitors with 401 before looking anything up or signing", async () => {
    const sign = vi.spyOn(cloudinary.utils, "private_download_url");
    const { req, findByID } = fakeReq(users.anonymous);
    const res = await intakeSignedUrlEndpoint.handler(req);
    expect(res.status).toBe(401);
    expect(findByID).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
  });

  it.each(["editor", "reviewer", "legal"] as const)("refuses a logged-in %s with 403 and gives no URL", async (who) => {
    const sign = vi.spyOn(cloudinary.utils, "private_download_url");
    const { req, findByID } = fakeReq(users[who]);
    const res = await intakeSignedUrlEndpoint.handler(req);
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toMatch(/cloudinary|signature|https?:/i);
    expect(findByID).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
  });

  it("gives an admin a signed, expiring download link that is not cached", async () => {
    const before = Math.floor(Date.now() / 1000);
    const { req } = fakeReq(users.admin);
    const res = await intakeSignedUrlEndpoint.handler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = (await res.json()) as { url: string; expiresAt: string };

    const url = new URL(body.url);
    expect(url.host).toBe("api.cloudinary.com");
    expect(url.pathname).toBe(`/v1_1/${CLOUD}/image/download`);
    expect(url.searchParams.get("type")).toBe("authenticated");
    expect(url.searchParams.get("public_id")).toBe(STORED.cloudinaryPublicId);
    expect(url.searchParams.get("signature")).toMatch(/^[0-9a-f]{40}$/);
    const exp = Number(url.searchParams.get("expires_at"));
    expect(exp).toBeGreaterThan(before);
    expect(exp).toBeLessThanOrEqual(before + INTAKE_URL_TTL_SECONDS + 1);
    expect(new Date(body.expiresAt).getTime()).toBe(exp * 1000);
  });

  it("returns 404 to an admin for a file that isn't on Cloudinary", async () => {
    const { req } = fakeReq(users.admin, null);
    expect((await intakeSignedUrlEndpoint.handler(req)).status).toBe(404);
  });
});

describe("signIntakeUrl", () => {
  it("binds the expiry into the signature, so editing expires_at breaks the link", () => {
    const { url } = signIntakeUrl(STORED, { now: Date.UTC(2026, 0, 1) });
    const params = Object.fromEntries(new URL(url).searchParams);
    const { signature, api_key: _key, ...signed } = params;
    expect(cloudinary.utils.api_sign_request(signed, SECRET)).toBe(signature);
    expect(cloudinary.utils.api_sign_request({ ...signed, expires_at: String(Number(signed.expires_at) + 86400) }, SECRET)).not.toBe(signature);
  });

  it("never produces a res.cloudinary.com delivery URL (those can't expire)", () => {
    expect(signIntakeUrl(STORED).url).not.toContain("res.cloudinary.com");
  });
});

describe("intake file route (/api/intake-files/file/:filename)", () => {
  const adapter = cloudinaryAdapter({ delivery: "private", folder: "intake", cloudName: CLOUD })({
    collection: { slug: "intake-files" } as CollectionConfig,
  });
  const params = { collection: "intake-files", filename: STORED.filename };

  it.each(["anonymous", "editor", "reviewer", "legal"] as const)("refuses %s", async (who) => {
    const { req, find } = fakeReq(users[who]);
    const res = await adapter.staticHandler(req, { params });
    expect([401, 403]).toContain(res.status);
    expect(res.headers.get("Location")).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });

  it("redirects an admin to a fresh signed link", async () => {
    const { req } = fakeReq(users.admin);
    const res = await adapter.staticHandler(req, { params });
    expect(res.status).toBe(302);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Location")).toMatch(new RegExp(`^https://api\\.cloudinary\\.com/v1_1/${CLOUD}/image/download\\?`));
  });
});
