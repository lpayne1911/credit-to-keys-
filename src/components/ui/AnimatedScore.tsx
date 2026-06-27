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
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    setDisplay(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
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
