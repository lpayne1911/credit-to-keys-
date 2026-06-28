"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The deal score, counting up from 0 the first time it paints — the small
 * "reward" beat that makes the result feel computed, matching the landing-page
 * mockup. SSR (and reduced-motion) render the final value immediately, so the
 * number is always correct without JS.
 */
export function AnimatedScore({
  value,
  className = "",
  durationMs = 1100,
}: {
  value: number;
  className?: string;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(value);
  // Where the next animation starts: 0 on first mount, otherwise the value last
  // shown — so live edits (e.g. an operator adjusting flags) tween smoothly.
  const fromRef = useRef(0);
  const firstRun = useRef(true);

  useEffect(() => {
    const from = firstRun.current ? 0 : fromRef.current;
    firstRun.current = false;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return (
    <span className={className} suppressHydrationWarning>
      {display}
    </span>
  );
}
