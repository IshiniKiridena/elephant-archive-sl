import { htmlToText, norm, pdfToText } from "./text";
import { judgeSupport } from "./llm";
import type { Finding, ProposedRecord } from "./types";

/**
 * Check 3: sources. Fetched pages are DATA only. Nothing here follows links found in pages.
 */

const SOCIAL = /(^|\.)(facebook\.com|fb\.watch|instagram\.com|x\.com|twitter\.com|tiktok\.com|threads\.net|youtube\.com|youtu\.be|whatsapp\.com)$/i;
const UA = "ElephantArchiveSL-FactCheck/1.0 (+contact via site)";

export interface FetchedPage {
  url: string;
  ok: boolean;
  status: number;
  text: string;
  title?: string;
  published?: string;
  social: boolean;
  error?: string;
}

const cache = new Map<string, FetchedPage>();

export async function fetchPage(url: string): Promise<FetchedPage> {
  const hit = cache.get(url);
  if (hit) return hit;
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return { url, ok: false, status: 0, text: "", social: false, error: "Not a valid URL" };
  }
  const social = SOCIAL.test(host);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/pdf;q=0.9,*/*;q=0.5" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    const type = res.headers.get("content-type") ?? "";
    let page: FetchedPage;
    if (type.includes("pdf")) {
      page = { url, ok: res.ok, status: res.status, text: await pdfToText(Buffer.from(await res.arrayBuffer())), social };
    } else {
      const { text, title, published } = htmlToText(await res.text());
      page = { url, ok: res.ok, status: res.status, text, title, published, social };
    }
    // Social sites often return a login wall with 200 OK: treat tiny pages as unreadable.
    if (page.ok && page.text.length < 400) page = { ...page, ok: false, error: "Page returned almost no readable text (login wall?)" };
    cache.set(url, page);
    return page;
  } catch (e) {
    const page = { url, ok: false, status: 0, text: "", social, error: (e as Error).message };
    cache.set(url, page);
    return page;
  }
}

/** Ask the Wayback Machine to keep a copy. Best effort; failures are ignored. */
export async function archiveCopy(url: string): Promise<string | undefined> {
  if (process.env.ARCHIVE_ON_CHECK !== "1") return undefined;
  try {
    const res = await fetch(`https://web.archive.org/save/${url}`, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(60_000),
    });
    return res.ok ? res.url : undefined;
  } catch {
    return undefined;
  }
}

const claimText = (r: ProposedRecord) =>
  [
    r.summary,
    ...Object.entries(r.fields)
      .filter(([, f]) => f.value !== null && f.value !== "")
      .map(([k, f]) => `${k}: ${String(f.value)}`),
  ].join("\n");

export interface SourceCheckResult {
  findings: Finding[];
  supportedBy: { url: string; verdict: string; note: string }[];
  archived: Record<string, string>;
}

export async function checkSources(r: ProposedRecord, opts: { online: boolean }): Promise<SourceCheckResult> {
  const findings: Finding[] = [];
  const supportedBy: SourceCheckResult["supportedBy"] = [];
  const archived: Record<string, string> = {};
  if (r.target === "source") return { findings, supportedBy, archived };

  for (const [i, s] of r.sources.entries()) {
    const field = `sources.${i}`;
    if (!s.url) {
      findings.push({ check: "sources", severity: "warn", field, message: "Offline source (no URL). Editor must confirm it supports the record" });
      continue;
    }
    const page = await fetchPage(s.url);
    if (!page.ok) {
      findings.push({
        check: "sources",
        severity: "warn",
        field,
        message: page.social
          ? "Social post could not be read automatically. Paste its text or a screenshot into the batch, or the editor confirms it by hand"
          : `Source unreachable (${page.error ?? page.status}). Find an archived copy or another source`,
      });
      continue;
    }
    const a = await archiveCopy(s.url);
    if (a) archived[s.url] = a;

    if (!opts.online) {
      findings.push({ check: "sources", severity: "warn", field, message: "Offline mode: page is live, editor must confirm it supports the record" });
      continue;
    }
    const j = await judgeSupport(claimText(r), page.text);
    if (!j) {
      findings.push({ check: "sources", severity: "warn", field, message: "Support check returned nothing. Editor confirms by hand" });
      continue;
    }
    // The judge's own evidence must exist in the page, or its verdict is not trusted.
    const grounded = !j.evidence || norm(page.text).includes(norm(j.evidence));
    supportedBy.push({ url: s.url, verdict: grounded ? j.verdict : "unconfirmed", note: j.note });
    if (!grounded) findings.push({ check: "sources", severity: "warn", field, message: "Support check quoted words not on the page. Editor confirms by hand" });
    else if (j.verdict === "contradicts") findings.push({ check: "sources", severity: "block", field, message: `Source contradicts this record: ${j.note}` });
    else if (j.verdict === "not_found") findings.push({ check: "sources", severity: "warn", field, message: `Source does not mention this: ${j.note}` });
    else if (j.verdict === "partly_supported") findings.push({ check: "sources", severity: "warn", field, message: `Only partly supported: ${j.note}` });
  }
  return { findings, supportedBy, archived };
}
