"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Mobile-only sticky bottom CTA. The buyer may be sitting in the finance office,
 * so the primary action is always one thumb-tap away.
 *
 * It must never cover content, so it:
 *   • appears only AFTER the hero scrolls past (not over the fold), and
 *   • hides again near the page bottom, where the final CTA + footer live, so it
 *     never overlaps another primary button.
 * Hidden on sm+ where the header CTA is always visible. The page reserves
 * bottom padding equal to this bar's height (see the spacer in page.tsx).
 */
export function StickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const pastHero = y > 520;
      // Distance from the bottom of the document.
      const fromBottom =
        document.documentElement.scrollHeight - (y + window.innerHeight);
      const nearBottom = fromBottom < 240; // final CTA / footer zone
      setShow(pastHero && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 transition-all duration-300 sm:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="rounded-2xl border border-white/60 bg-cream/90 p-2 shadow-glass backdrop-blur-xl">
        <Link href="/check" className="btn-primary w-full text-sm">
          Check my deal before I sign
        </Link>
      </div>
    </div>
  );
}
