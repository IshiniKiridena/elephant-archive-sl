"use client";

import { useState } from "react";
import { LabelChips } from "@/components/LabelChips"; // Phase 0 component: shows the word, not colour alone

/**
 * "Did you know?" flip card. Front: the fact. Back: where it came from + both labels.
 * Only Fact records that a human has published may be passed in.
 */
export interface FactCardProps {
  id: string | number;
  locale: "si" | "ta" | "en";
  statement: string;
  statementLang: "si" | "ta" | "en"; // language the text is actually in (fallbacks stay honest)
  sourceType: string;
  verification: string;
  source: { title: string; publisher?: string; date?: string; url?: string };
  labels: { flip: string; back: string; source: string; share: string };
}

export function FactCard(p: FactCardProps) {
  const [flipped, setFlipped] = useState(false);
  const shareHref = `/share-card/fact/${p.id}?format=story&locale=${p.locale}`;

  return (
    <article className="fact-card card" data-flipped={flipped}>
      <div className="inner">
        <div className="face front" aria-hidden={flipped}>
          <p className="text-xs uppercase tracking-wider text-sand">Did you know?</p>
          <p lang={p.statementLang} className="text-lg text-ivory">
            {p.statement}
          </p>
          <button type="button" className="mt-auto self-start text-sm text-sage underline" onClick={() => setFlipped(true)} aria-expanded={flipped}>
            {p.labels.flip}
          </button>
        </div>

        <div className="face back" aria-hidden={!flipped}>
          <p className="text-xs uppercase tracking-wider text-sand">{p.labels.source}</p>
          <p className="text-ivory">
            {p.source.url ? (
              <a href={p.source.url} rel="noopener noreferrer" target="_blank">
                {p.source.title}
              </a>
            ) : (
              p.source.title
            )}
          </p>
          <p className="text-sm text-muted">{[p.source.publisher, p.source.date].filter(Boolean).join(" · ")}</p>
          <LabelChips sourceType={p.sourceType} verification={p.verification} />
          <div className="mt-auto flex gap-4 text-sm">
            <button type="button" className="text-sage underline" onClick={() => setFlipped(false)}>
              {p.labels.back}
            </button>
            <a href={shareHref} download className="text-sage underline">
              {p.labels.share}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
