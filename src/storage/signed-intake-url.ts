import type { Endpoint, PayloadRequest } from "payload";
import { hasRole } from "../access/roles";
import { cloudinaryFromEnv } from "./cloudinary-env";
import { signIntakeUrl, type StoredAsset } from "./cloudinary-urls";

/**
 * Intake files are private evidence (screenshots, documents people sent in). Only admins may open
 * them, and only through a link that expires. Staff can still upload and see the file list.
 */
export const canGetSignedIntakeUrl = (user: unknown): boolean => hasRole(user);

const NO_STORE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const deny = (status: 401 | 403) =>
  Response.json({ error: status === 401 ? "Log in required" : "Only admins can open intake files" }, { status, headers: NO_STORE });

/** Finds the stored asset for an intake-file document. Access is checked by the caller. */
async function findIntakeAsset(req: PayloadRequest, where: { id: string } | { filename: string }): Promise<StoredAsset | null> {
  if ("id" in where) {
    const doc = await req.payload.findByID({ collection: "intake-files", id: where.id, depth: 0, overrideAccess: true, disableErrors: true, req });
    return doc ?? null;
  }
  const { docs } = await req.payload.find({
    collection: "intake-files",
    where: { filename: { equals: where.filename } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  return docs[0] ?? null;
}

/** Answers with a 302 to a fresh signed link, or 401/403/404. Shared by the endpoint and the file route. */
export async function respondWithSignedIntakeUrl(
  req: PayloadRequest,
  where: { id: string } | { filename: string },
  mode: "json" | "redirect",
): Promise<Response> {
  // Access first: nothing is looked up or signed for non-admins.
  if (!req.user) return deny(401);
  if (!canGetSignedIntakeUrl(req.user)) return deny(403);
  if (!cloudinaryFromEnv()) {
    return Response.json({ error: "Cloudinary is not configured; intake files are on local disk" }, { status: 503, headers: NO_STORE });
  }
  const asset = await findIntakeAsset(req, where);
  if (!asset?.cloudinaryPublicId) return Response.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  const signed = signIntakeUrl(asset);
  if (mode === "redirect") return new Response(null, { status: 302, headers: { ...NO_STORE, Location: signed.url } });
  return Response.json(signed, { headers: NO_STORE });
}

/** GET /api/intake-files/:id/signed-url → { url, expiresAt }. Admin only. */
export const intakeSignedUrlEndpoint: Endpoint = {
  path: "/:id/signed-url",
  method: "get",
  handler: (req) => respondWithSignedIntakeUrl(req, { id: String(req.routeParams?.id ?? "") }, "json"),
};
