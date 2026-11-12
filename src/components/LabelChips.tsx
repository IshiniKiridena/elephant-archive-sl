import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import type { Messages } from "@/i18n/messages/en";
import type { SourceType, VerificationStatus } from "@/lib/evidence-labels";

/**
 * The two labels every figure, claim and story carries (project rule 2).
 * Server component: no state, no client JS.
 *
 * Words, not colour alone: each chip prints its label, and screen readers hear
 * "Source type: News" / "Verification: Single source". Colour is only a secondary cue.
 * Values come from lib/evidence-labels.ts; words from the message files (shared with the admin).
 *
 * Pass `locale` (the usual case). Client components that already hold the message slice
 * may pass `t` (messages.evidence) instead.
 */

// Outline chips: every border clears 3:1 on canopy, surface and umber (design ui-inspiration §5)
const SOURCE_STYLE = "border-sand/40 text-muted";
const VERIFICATION_STYLE: Record<VerificationStatus, string> = {
  verified: "border-sage text-ivory",
  multiple_outlets: "border-sage text-ivory",
  single_source: "border-sand/60 text-ivory",
  disputed: "border-sand text-sand",
  unverified: "border-muted/60 text-muted",
};
const UNKNOWN_STYLE = "border-muted/60 text-muted";

// md: title blocks and label cards; sm: rows in lists (design: Source page)
const SIZE = {
  md: { list: "gap-2 text-[0.8125rem]", chip: "px-2.75 py-0.5" },
  sm: { list: "gap-1.5 text-xs", chip: "px-2.25 py-px" },
} as const;
// Long si/ta labels wrap inside the chip rather than overflowing a narrow screen
const CHIP = "max-w-full rounded-full border break-words";

type Props = {
  sourceType?: SourceType | (string & {}) | null;
  verification?: VerificationStatus | (string & {}) | null;
  size?: keyof typeof SIZE;
} & ({ locale: Locale; t?: undefined } | { t: Messages["evidence"]; locale?: Locale });

const isKey = <K extends string>(map: Record<K, unknown>, v: string): v is K => Object.hasOwn(map, v);

export function LabelChips({ sourceType, verification, size = "md", locale, t }: Props) {
  if (!sourceType && !verification) return null;
  const m = t ?? getMessages(locale!).evidence;
  const s = SIZE[size];

  return (
    <ul lang={locale} aria-label={m.groupLabel} className={`flex min-w-0 max-w-full flex-wrap ${s.list}`}>
      {sourceType && (
        <li className={`${CHIP} ${s.chip} ${SOURCE_STYLE}`}>
          <span className="sr-only">{m.sourceTypePrefix} </span>
          {isKey<SourceType>(m.sourceType, sourceType) ? m.sourceType[sourceType] : sourceType}
        </li>
      )}
      {verification && (
        <li className={`${CHIP} ${s.chip} ${isKey(VERIFICATION_STYLE, verification) ? VERIFICATION_STYLE[verification] : UNKNOWN_STYLE}`}>
          <span className="sr-only">{m.verificationPrefix} </span>
          {isKey<VerificationStatus>(m.verification, verification) ? m.verification[verification] : verification}
        </li>
      )}
    </ul>
  );
}
