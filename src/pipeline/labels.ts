import type { ProposedSource, SourceType, Verification } from "./types";

/**
 * Label SUGGESTIONS only. The editor confirms both labels; "verified" is never suggested.
 */

const RANK: SourceType[] = ["court_record", "official", "academic", "organisation", "news", "community", "social_media", "unverified"];

export function suggestSourceType(sources: ProposedSource[]): SourceType {
  return sources.map((s) => s.sourceType).sort((a, b) => RANK.indexOf(a) - RANK.indexOf(b))[0] ?? "unverified";
}

export function suggestVerification(sources: ProposedSource[], disputed: boolean): Exclude<Verification, "verified"> {
  if (disputed) return "disputed";
  const credible = sources.filter((s) => s.sourceType !== "social_media" && s.sourceType !== "unverified");
  if (credible.length === 0) return "unverified";
  const outlets = new Set(
    credible.map((s) => (s.publisher ?? (s.url ? new URL(s.url).hostname.replace(/^www\./, "") : s.title ?? "")).toLowerCase()),
  );
  return outlets.size >= 2 ? "multiple_outlets" : "single_source";
}
