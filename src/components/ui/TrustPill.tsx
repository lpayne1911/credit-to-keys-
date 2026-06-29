import type { ReactNode } from "react";

/**
 * A reassurance pill for the dark trust band ("No dealer kickbacks", etc).
 * Glassy on navy, with a small gold check.
 */
export function TrustPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-cream backdrop-blur">
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden>
        <circle cx="10" cy="10" r="9" fill="#C98A12" fillOpacity="0.18" />
        <path
          d="M6 10.5l2.5 2.5L14 7"
          fill="none"
          stroke="#E3BC78"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}
