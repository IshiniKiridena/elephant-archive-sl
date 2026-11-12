import { en, type Messages } from "../i18n/messages/en";

/**
 * The two labels every figure, claim and story carries (project rule 2).
 * Values are defined here once; their words live in the message files (messages.evidence),
 * so the admin select options and the public chips can never drift apart.
 */

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

export const VERIFICATION_STATUSES = [
  "verified", // human-only
  "multiple_outlets",
  "single_source",
  "disputed",
  "unverified",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Select options for Payload. The admin is English-only, so it defaults to the English labels. */
export const sourceTypeOptions = (m: Messages = en) =>
  SOURCE_TYPES.map((value) => ({ value, label: m.evidence.sourceType[value] }));

export const verificationOptions = (m: Messages = en) =>
  VERIFICATION_STATUSES.map((value) => ({ value, label: m.evidence.verification[value] }));
