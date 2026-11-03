import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getPayload } from "payload";
import config from "@payload-config";
import { tokens as t } from "@/styles/tokens";

/**
 * Share cards: /share-card/fact/12?format=story|og&locale=en
 * Every card carries the source, both labels and the short purpose line, so a shared
 * image never travels without its evidence. Published records only.
 * Elephant cards show no photo here (photo permissions may not cover social re-use);
 * add one only for Media with permission "share_allowed".
 *
 * Fonts: put NotoSans-Regular.ttf, NotoSansSinhala-Regular.ttf, NotoSansTamil-Regular.ttf
 * in /public/fonts (OFL licence). next/og needs the files to render Sinhala/Tamil;
 * any missing file is skipped (Latin falls back to the built-in font, si/ta would show boxes).
 */

export const revalidate = 86400; // re-render daily; publishing triggers on-demand revalidation too

const SIZES = { story: { width: 1080, height: 1920 }, og: { width: 1200, height: 630 } } as const;
const PURPOSE_SHORT = "Not taking sides. Advocating for Sri Lanka's elephants through open, labelled evidence.";
const LABEL_TEXT: Record<string, string> = {
  official: "Official", court_record: "Court record", academic: "Academic", news: "News", organisation: "Organisation",
  community: "Community", social_media: "Social media", unverified: "Unverified",
  verified: "Verified", multiple_outlets: "Reported by multiple outlets", single_source: "Single source", disputed: "Disputed",
};

const FONT_FILES = ["NotoSans-Regular.ttf", "NotoSansSinhala-Regular.ttf", "NotoSansTamil-Regular.ttf"];
async function loadFonts() {
  const out: { name: string; data: Buffer; style: "normal" }[] = [];
  for (const file of FONT_FILES) {
    try {
      out.push({ name: "Noto", data: await readFile(path.join(process.cwd(), "public/fonts", file)), style: "normal" });
    } catch {
      /* missing font file: skip */
    }
  }
  return out;
}

export async function GET(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "og" ? "og" : "story";
  const locale = (["si", "ta", "en"].includes(url.searchParams.get("locale") ?? "") ? url.searchParams.get("locale") : "en") as "si" | "ta" | "en";

  const payload = await getPayload({ config });
  const collection = kind === "fact" ? "facts" : kind === "elephant" ? "elephants" : null;
  if (!collection) return new Response("Unknown kind", { status: 404 });

  const res = await payload.find({
    collection: collection as never,
    where: { and: [{ id: { equals: id } }, { _status: { equals: "published" } }] },
    locale,
    depth: 1,
    limit: 1,
  });
  const doc = res.docs[0] as Record<string, unknown> | undefined;
  if (!doc) return new Response("Not found", { status: 404 });

  const firstSource = (doc.sources as { title?: string; publisher?: string; date?: string }[] | undefined)?.[0];
  const headline =
    kind === "fact" ? String(doc.statement ?? "") : String(doc.nameEn ?? doc.name ?? "");
  const kicker = kind === "fact" ? "Did you know?" : "Meet the elephants";
  const chips = [LABEL_TEXT[String(doc.sourceType)] ?? "", LABEL_TEXT[String(doc.verificationStatus)] ?? ""].filter(Boolean);
  const { width, height } = SIZES[format];
  const big = format === "story";

  return new ImageResponse(
    (
      <div style={{ width, height, display: "flex", flexDirection: "column", background: t.canopy, color: t.ivory, padding: big ? 96 : 64, fontFamily: "Noto" }}>
        <div style={{ display: "flex", fontSize: big ? 34 : 26, color: t.sand, letterSpacing: 2, textTransform: "uppercase" }}>{kicker}</div>
        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", fontSize: big ? 72 : 48, lineHeight: locale === "en" ? 1.25 : 1.5 }}>{headline}</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {chips.map((c) => (
            <div key={c} style={{ display: "flex", border: `2px solid ${t.sage}`, borderRadius: 999, padding: "8px 22px", fontSize: big ? 28 : 22, color: t.ivory }}>
              {c}
            </div>
          ))}
        </div>
        {firstSource && (
          <div style={{ display: "flex", fontSize: big ? 28 : 22, color: t.muted, marginBottom: 32 }}>
            Source: {[firstSource.title, firstSource.publisher, firstSource.date].filter(Boolean).join(" · ")}
          </div>
        )}
        <div style={{ display: "flex", borderTop: `1px solid ${t.sand}`, paddingTop: 24, justifyContent: "space-between", fontSize: big ? 26 : 20, color: t.muted }}>
          <span>{PURPOSE_SHORT}</span>
        </div>
        <div style={{ display: "flex", marginTop: 16, fontSize: big ? 30 : 22, color: t.sand }}>Elephant Archive Sri Lanka</div>
      </div>
    ),
    {
      width,
      height,
      fonts: await loadFonts(),
    },
  );
}
