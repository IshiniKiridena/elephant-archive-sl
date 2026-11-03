/**
 * The two labels every figure, claim and story carries (project rule 2).
 * Words, not colour alone: each chip prints its label; colour is only a secondary cue.
 * English labels for now; si/ta label text goes in the dictionaries once reviewed.
 */
const SOURCE_TYPE_LABEL: Record<string, string> = {
  official: "Official",
  court_record: "Court record",
  academic: "Academic",
  news: "News",
  organisation: "Organisation",
  community: "Community",
  social_media: "Social media",
  unverified: "Unverified source",
};

const VERIFICATION_LABEL: Record<string, string> = {
  verified: "Verified",
  multiple_outlets: "Reported by multiple outlets",
  single_source: "Single source",
  disputed: "Disputed",
  unverified: "Unverified",
};

// Outline chips on dark surfaces: sage/sand/ivory borders all clear 3:1 against canopy and surface
const VERIFICATION_STYLE: Record<string, string> = {
  verified: "border-sage text-ivory",
  multiple_outlets: "border-sage text-ivory",
  single_source: "border-sand/60 text-ivory",
  disputed: "border-sand text-sand",
  unverified: "border-muted/60 text-muted",
};

export function LabelChips({ sourceType, verification }: { sourceType?: string | null; verification?: string | null }) {
  return (
    <ul className="flex flex-wrap gap-2 text-xs" aria-label="Evidence labels">
      {sourceType && (
        <li className="rounded-full border border-sand/40 px-2.5 py-0.5 text-muted">
          <span className="sr-only">Source type: </span>
          {SOURCE_TYPE_LABEL[sourceType] ?? sourceType}
        </li>
      )}
      {verification && (
        <li className={`rounded-full border px-2.5 py-0.5 ${VERIFICATION_STYLE[verification] ?? "border-muted/60 text-muted"}`}>
          <span className="sr-only">Verification: </span>
          {VERIFICATION_LABEL[verification] ?? verification}
        </li>
      )}
    </ul>
  );
}
