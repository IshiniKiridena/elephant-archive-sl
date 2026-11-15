"use client";

import { useState } from "react";

/**
 * "Copy citation" button: the only client JS on the Source page. The citation stays visible on the
 * page, so nothing is lost without JS or clipboard access. No motion: only the label and icon change.
 */
export function CopyCitation({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false))}
      className="btn-ghost inline-flex min-h-12 cursor-pointer items-center gap-2.5 px-5"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d={copied ? "M20 6L9 17l-5-5" : "M9 9h10v10H9zM5 15V5h10"} />
      </svg>
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
