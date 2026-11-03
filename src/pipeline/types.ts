/**
 * Shared types for the ingest + fact-check pipeline.
 * Nothing in this folder publishes anything. Output is Candidates (staging) and,
 * after human approval, *draft* records in target collections.
 */

export const TARGETS = [
  "source",
  "elephantDeath",
  "elephant",
  "lifeEvent",
  "rescue",
  "courtCase",
  "governmentAction",
  "historyItem",
  "communityStory",
  "fact",
  "humanDeathAggregate",
] as const;
export type Target = (typeof TARGETS)[number];

export const SOURCE_TYPES = [
  "official",
  "court_record",
  "academic",
  "news",
  "organisation",
  "community",
  "social_media",
  "unverified",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const VERIFICATION = [
  "verified", // human-only
  "multiple_outlets",
  "single_source",
  "disputed",
  "unverified",
] as const;
export type Verification = (typeof VERIFICATION)[number];

export type Severity = "pass" | "warn" | "block";

export interface Finding {
  check: CheckName;
  severity: Severity;
  field?: string;
  message: string;
}

export type CheckName =
  | "grounding"
  | "dual_read"
  | "sources"
  | "consistency"
  | "rules"
  | "pre_promote";

/** A field value plus the verbatim span of input it came from (internal only, never published). */
export interface ExtractedField {
  value: string | number | boolean | null;
  evidence: string;
}

export interface ProposedSource {
  url?: string;
  title?: string;
  publisher?: string;
  date?: string; // ISO date or YYYY or YYYY-MM
  sourceType: SourceType;
}

/** Link from one proposed record to another in the same bundle, or to an existing DB record. */
export interface ProposedLink {
  field: string; // field on this record, e.g. "elephant" on an elephantDeath
  toLocalKey?: string; // sibling in the same bundle
  matchName?: string; // or: look up an existing record by name (e.g. an elephant's name)
}

export interface ProposedRecord {
  localKey: string; // "r1", "r2" … unique within one extraction
  target: Target;
  summary: string; // one line, editor-facing
  fields: Record<string, ExtractedField>;
  sources: ProposedSource[];
  links: ProposedLink[];
  /** Model's flag: the text names private individuals (not officials acting in role). */
  mentionsPrivatePersons: boolean;
  inputLanguage: "en" | "si" | "ta" | "mixed";
}

export interface IntakeInput {
  batchId: string | number;
  text: string; // all text material concatenated with headers
  images: { mediaType: string; base64: string; label: string }[];
  urls: string[];
  defaultSourceType?: SourceType;
  hintTarget?: Target;
  offlineRecords?: ProposedRecord[]; // from CSV in offline mode
}

export type CandidateStatus =
  | "extracted"
  | "checking"
  | "needs_attention"
  | "ready_for_review"
  | "editor_approved"
  | "reviewer_approved"
  | "legal_approved"
  | "promoted"
  | "rejected";

export const worst = (findings: Finding[]): Severity =>
  findings.some((f) => f.severity === "block")
    ? "block"
    : findings.some((f) => f.severity === "warn")
      ? "warn"
      : "pass";
