"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Herd hero: our own line-art elephant family walking slowly across the hero.
 * Bright zone only (Home, History, Facts). Static under reduced motion / data saver (CSS).
 * Pause button because motion lasts longer than 5 s (WCAG 2.2.2). Pauses when off-screen.
 * Placeholder drawing: replace the <Elephant> paths with the commissioned illustration.
 */

function Elephant({ scale = 1, x = 0 }: { scale?: number; x?: number }) {
  return (
    <g transform={`translate(${x} ${120 - 120 * scale}) scale(${scale})`} fill="none" stroke="currentColor" strokeWidth={1.5 / scale} strokeLinecap="round" strokeLinejoin="round">
      {/* body + back */}
      <path d="M18 62 C20 34 44 22 74 24 C98 26 112 38 114 58 C115 70 112 78 108 82" />
      {/* head, ear, trunk */}
      <path d="M18 62 C10 60 6 52 8 44 C10 34 20 30 28 34" />
      <path d="M26 38 C34 34 42 40 40 52 C38 62 30 64 26 60" />
      <path d="M8 46 C2 58 2 74 6 88 C7 92 11 92 11 88" />
      {/* tusk */}
      <path d="M12 60 C14 66 20 68 26 66" stroke="var(--color-ivory)" />
      {/* tail */}
      <path d="M113 56 C118 62 119 70 117 76" />
      {/* legs: two groups swing in opposite phase */}
      <path className="leg a" d="M30 70 L30 104 M88 76 L88 104" />
      <path className="leg b" d="M44 74 L44 104 M100 74 L100 104" />
      {/* eye */}
      <circle cx="20" cy="46" r="1" fill="currentColor" stroke="none" />
    </g>
  );
}

function Herd() {
  return (
    <svg viewBox="0 0 360 120" width="360" height="120" role="img" aria-label="Line drawing of an elephant family walking">
      <Elephant x={0} scale={1} />
      <Elephant x={130} scale={0.62} />
      <Elephant x={210} scale={0.95} />
    </svg>
  );
}

export function ElephantWalk({ pauseLabel = "Pause", playLabel = "Play" }: { pauseLabel?: string; playLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="herd" aria-hidden={false}>
      <div ref={ref} className="herd-anim" data-paused={paused} data-offscreen={offscreen}>
        <div className="herd-track">
          <Herd />
        </div>
        <button type="button" className="herd-pause" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? playLabel : pauseLabel}
        </button>
      </div>
      <div className="herd-static">
        <Herd />
      </div>
    </div>
  );
}
