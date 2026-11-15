import config from "@payload-config";
import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { handleEnablePreview } from "@/lib/preview";

/** Turns on draft preview for staff. Linked from the admin's Preview button. */
export async function GET(request: Request) {
  return handleEnablePreview(request, {
    secret: process.env.PREVIEW_SECRET,
    getUser: async () => {
      const payload = await getPayload({ config });
      return (await payload.auth({ headers: request.headers })).user;
    },
    enable: async () => (await draftMode()).enable(),
  });
}
