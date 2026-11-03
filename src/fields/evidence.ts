import type { Access, Field, FieldAccess } from "payload";
import { hasRole } from "../access/roles";
import { SOURCE_TYPES, VERIFICATION } from "../pipeline/types";

/**
 * Shared fields for every public record (deaths, elephants, rescues, facts…).
 * Spread them into a collection's fields: [...evidenceFields(), ...yourFields]
 *
 * Project rule 2: every figure, claim and story carries two labels and at least one source.
 * These are enforced on publish, not on draft, so editors can save work in progress.
 */

const SOURCE_TYPE_OPTIONS = [
  { label: "Official", value: "official" },
  { label: "Court record", value: "court_record" },
  { label: "Academic", value: "academic" },
  { label: "News", value: "news" },
  { label: "Organisation", value: "organisation" },
  { label: "Community", value: "community" },
  { label: "Social media", value: "social_media" },
  { label: "Unverified", value: "unverified" },
] satisfies { label: string; value: (typeof SOURCE_TYPES)[number] }[];

const VERIFICATION_OPTIONS = [
  { label: "Verified", value: "verified" },
  { label: "Reported by multiple outlets", value: "multiple_outlets" },
  { label: "Single source", value: "single_source" },
  { label: "Disputed", value: "disputed" },
  { label: "Unverified", value: "unverified" },
] satisfies { label: string; value: (typeof VERIFICATION)[number] }[];

const isPublishing = (data: Record<string, unknown> | undefined) => data?._status === "published";

/** Only editors (and admins) may set "Verified": a human decision, never the pipeline's. */
const canSetVerified: FieldAccess = ({ req }) => hasRole(req.user, "editor");

export const labelFields = (): Field[] => [
  {
    type: "row",
    fields: [
      {
        name: "sourceType",
        type: "select",
        options: SOURCE_TYPE_OPTIONS,
        admin: { width: "50%", description: "The strongest source type among this record's sources" },
        validate: (v: unknown, { data }: { data: Record<string, unknown> }) =>
          !isPublishing(data) || !!v || "Choose a source type before publishing",
      },
      {
        name: "verificationStatus",
        type: "select",
        options: VERIFICATION_OPTIONS,
        access: { update: canSetVerified, create: canSetVerified },
        admin: { width: "50%", description: "Only a person may choose Verified" },
        validate: (v: unknown, { data }: { data: Record<string, unknown> }) =>
          !isPublishing(data) || !!v || "Choose a verification status before publishing",
      },
    ],
  },
];

export const sourcesField = (): Field => ({
  name: "sources",
  type: "relationship",
  relationTo: "sources",
  hasMany: true,
  admin: { description: "Every source for this record. Conflicting sources stay, with the record marked Disputed." },
  validate: (v: unknown, { data }: { data: Record<string, unknown> }) =>
    !isPublishing(data) || (Array.isArray(v) && v.length > 0) || "Add at least one source before publishing",
});

/**
 * Per-language translation state (rule 6). "needs_review" = written by someone who is not a
 * native speaker (including AI); public pages show a small "translation under review" note.
 */
export const translationReviewField = (): Field => ({
  name: "translationReview",
  type: "group",
  admin: { position: "sidebar", description: "Sinhala and Tamil text must be approved by a native speaker" },
  fields: (["si", "ta"] as const).map((lang) => ({
    name: lang,
    label: lang === "si" ? "Sinhala" : "Tamil",
    type: "select" as const,
    defaultValue: "missing",
    options: [
      { label: "Not translated yet", value: "missing" },
      { label: "Needs native review", value: "needs_review" },
      { label: "Approved by native speaker", value: "approved" },
    ],
  })),
});

export const evidenceFields = (): Field[] => [...labelFields(), sourcesField(), translationReviewField()];

/** Public visitors see published documents only; staff see drafts too. */
export const publishedOrStaff: Access = ({ req }) =>
  hasRole(req.user, "editor", "reviewer", "legal") ? true : { _status: { equals: "published" } };
