"use client";

import { useId, useRef, type ReactNode } from "react";

/**
 * The only client JS in the header: a Menu button that opens a native modal <dialog>.
 * The browser does the hard parts: showModal() makes the page behind it inert (focus stays in
 * the dialog), Escape closes it, and it is announced as a dialog. On close, focus returns to the
 * Menu button. Contents are server-rendered and passed in as children.
 *
 * Motion: none unless zone="bright"; then a 200 ms fade + 8px slide on open (opacity and
 * translate only, motion budget §5), every class motion-safe: so reduced motion turns it off.
 */

const BRIGHT_MOTION =
  "motion-safe:transition-[opacity,translate] motion-safe:duration-200 motion-safe:ease-out motion-safe:starting:open:opacity-0 motion-safe:starting:open:-translate-y-2";

type Props = {
  openLabel: string;
  closeLabel: string;
  lang: string;
  zone?: "bright" | "quiet";
  children: ReactNode;
};

export function MegaMenuDialog({ openLabel, closeLabel, lang, zone = "quiet", children }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-sand/25 px-3 text-ivory hover:border-sage max-sm:size-11 max-sm:px-0"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span className="text-[0.9375rem] max-sm:sr-only">{openLabel}</span>
      </button>

      <dialog
        ref={dialog}
        id={id}
        lang={lang}
        aria-labelledby={`${id}-title`}
        onClose={() => button.current?.focus()}
        // Following a link inside closes the menu (matters for same-page #anchors)
        onClick={(e) => (e.target as HTMLElement).closest("a") && close()}
        className={`m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-canopy p-0 text-ivory backdrop:bg-canopy ${zone === "bright" ? BRIGHT_MOTION : ""}`}
      >
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pb-12 pt-3 md:px-6">
          <div className="flex items-center justify-between gap-4 border-b border-sand/20 pb-3">
            <h2 id={`${id}-title`} className="text-xl font-bold">
              {openLabel}
            </h2>
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-sand/25 px-3 text-ivory hover:border-sage"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              <span className="text-[0.9375rem] max-sm:sr-only">{closeLabel}</span>
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
