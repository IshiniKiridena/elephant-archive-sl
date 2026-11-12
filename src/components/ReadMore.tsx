import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

/**
 * "Read more" for long sections (ui-inspiration §2, §4): native <details>/<summary>, no client JS.
 * Keyboard and screen readers get the platform behaviour (Enter/Space, expanded state).
 *
 * The summary reads "Read more" when closed and "Show less" when open (CSS only, via group-open).
 * The marker is a static +/−, swapped rather than rotated.
 *
 * Motion:
 * - zone="quiet" (default): open/close changes colour only. No transition or animation classes
 *   are emitted at all (advocacy.css also strips motion inside [data-zone="quiet"]).
 * - zone="bright": the revealed content fades in and moves 4px, 200 ms ease-out, opacity and
 *   translate only (motion budget §5), via @starting-style. Every motion class is motion-safe:,
 *   so prefers-reduced-motion turns it off.
 */

type Props = {
  locale: Locale;
  children: ReactNode;
  zone?: "bright" | "quiet";
  /** What is being expanded, for screen readers ("Read more: Example section"). */
  label?: string;
  /** Language of `label`, when it differs from the page. */
  labelLang?: Locale;
};

const BRIGHT_MOTION =
  "motion-safe:transition-[opacity,translate] motion-safe:duration-200 motion-safe:ease-out motion-safe:starting:opacity-0 motion-safe:starting:-translate-y-1";

export function ReadMore({ locale, children, zone = "quiet", label, labelLang }: Props) {
  const t = getMessages(locale).readMore;

  return (
    <details className="group">
      <summary
        lang={locale}
        className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm font-semibold text-sand hover:text-ivory group-open:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage [&::-webkit-details-marker]:hidden"
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
          <path d="M5 12h14" />
          <path d="M12 5v14" className="group-open:hidden" />
        </svg>
        <span className="group-open:hidden">{t.more}</span>
        <span className="hidden group-open:inline">{t.less}</span>
        {label && (
          <span className="sr-only">
            : <span lang={labelLang}>{label}</span>
          </span>
        )}
      </summary>
      <div className={`mt-2 ${zone === "bright" ? BRIGHT_MOTION : ""}`}>{children}</div>
    </details>
  );
}
