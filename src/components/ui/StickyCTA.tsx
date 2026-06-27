"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Mobile-only sticky bottom CTA. The buyer may be sitting in the finance office,
 * so the primary action is always one thumb-tap away. Appears after the hero
 * scrolls past; hidden on sm+ where the header CTA is always visible.
 */
export function StickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
