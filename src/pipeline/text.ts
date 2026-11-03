import Papa from "papaparse";
import type { Finding, ProposedRecord, SourceType, Target } from "./types";
import { TARGET_SPECS } from "./targets";

/** Lowercase, unify quotes/dashes, collapse whitespace. Used for evidence matching. */
export const norm = (s: string) =>
  s
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Rough HTML → text. Scripts/styles/nav removed. Result is treated as data only. */
export function htmlToText(html: string): { text: string; title?: string; published?: string } {
  const title = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1]?.trim();
  const published =
    html.match(/property=["']article:published_time["'][^>]*content=["']([^"']+)/i)?.[1] ??
    html.match(/<time[^>]*datetime=["']([^"']+)/i)?.[1];
  const text = html
    .replace(/<(script|style|noscript|nav|footer|header|aside|form|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
  return { text, title, published };
}

export async function pdfToText(buf: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

/**
 * Check 1: grounding. Every evidence span must appear in the material the model read.
 * Image-only evidence can't be string-matched, so it is a warning for a human to eyeball.
 */
export function checkGrounding(r: ProposedRecord, material: string, hadImages: boolean): Finding[] {
  const hay = norm(material);
  const out: Finding[] = [];
  for (const [k, f] of Object.entries(r.fields)) {
    if (f.value === null || f.value === "") continue;
    const ev = norm(f.evidence ?? "");
    if (!ev) {
      out.push({ check: "grounding", severity: "block", field: k, message: "No evidence span given for this value" });
    } else if (!hay.includes(ev)) {
      out.push(
        hadImages
          ? { check: "grounding", severity: "warn", field: k, message: "Evidence not in the text; may come from the screenshot. Check the image" }
          : { check: "grounding", severity: "block", field: k, message: `Evidence "${f.evidence.slice(0, 80)}" is not in the input. Possible invented value` },
      );
    }
  }
  return out;
}

/**
 * Offline mode: CSV rows → ProposedRecords. Header names = target field names, plus
 * source_url, source_title, publisher, source_date, source_type. Evidence = the row itself.
 */
export function csvToRecords(csv: string, target: Target, defaultType?: SourceType): ProposedRecord[] {
  const { data } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const spec = TARGET_SPECS[target];
  return data.map((row, i) => {
    const rowText = Object.values(row).join(" | ");
    const fields: ProposedRecord["fields"] = {};
    for (const k of Object.keys(spec.fields)) {
      const v = row[k]?.trim();
      if (v) fields[k] = { value: v === "true" ? true : v === "false" ? false : v, evidence: rowText };
    }
    return {
      localKey: `r${i + 1}`,
      target,
      summary: row.summary?.trim() || `${target} row ${i + 1}`,
      fields,
      sources: [
        {
          url: row.source_url?.trim() || undefined,
          title: row.source_title?.trim() || undefined,
          publisher: row.publisher?.trim() || undefined,
          date: row.source_date?.trim() || undefined,
          sourceType: (row.source_type?.trim() as SourceType) || defaultType || "unverified",
        },
      ],
      links: row.elephant_name ? [{ field: "elephant", matchName: row.elephant_name.trim() }] : [],
      mentionsPrivatePersons: false,
      inputLanguage: "en",
    };
  });
}
