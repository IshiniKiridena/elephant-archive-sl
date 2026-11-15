import { draftMode } from "next/headers";
import { exitPreviewTarget } from "@/lib/preview";

/** Turns draft preview off and goes back to the published version of the page. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  return new Response(null, { status: 307, headers: { Location: exitPreviewTarget(request), "Cache-Control": "no-store" } });
}
