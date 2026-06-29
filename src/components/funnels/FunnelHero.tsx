import Link from "next/link";
import type { ReactNode } from "react";
import { ACCENT_CLASSES, type Funnel } from "@/lib/funnels";
import { FunnelIcon } from "./icons";

/**
 * Funnel-page hero on dark navy. The accent shows in the eyebrow, icon, and
 * primary CTA — the lane's color, not gold-everywhere. `sideCard` is an optional
 * slot (e.g. the Quote Review turnaround card or a notice).
 */
export function FunnelHero({
  funnel,
  sideCard,
}: {
  funnel: Funnel;
  sideCard?: ReactNode;
}) {
  const a = ACCENT_CLASSES[funnel.accent];
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy to-navy" />
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className={`orb right-[-8rem] -top-24 h-[24rem] w-[24rem] ${a.bar} opacity-20`} />
      </div>
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide ${a.text}`}>
            <FunnelIcon name={funnel.heroIcon} className="h-3.5 w-3.5" />
            {funnel.eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            {funnel.title}
          </h1>
          <p className={`mt-3 text-lg font-semibold ${a.text}`}>{funnel.tagline}</p>
          <p className="mt-3 max-w-xl leading-relaxed text-white/75">{funnel.body}</p>
          {funnel.bullets && (
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {funnel.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-white/85">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${a.bar}`}>
                    <svg viewBox="0 0 20 20" className="h-3 w-3 text-white" fill="none" aria-hidden>
                      <path d="M5 10.5l2.5 2.5L15 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={funnel.primaryCta.href} className={`${a.btn} text-base`}>
              {funnel.primaryCta.label}
            </Link>
            {funnel.secondaryCta && (
              <Link href={funnel.secondaryCta.href} className="btn-outline-light px-5 py-3 text-base">
                {funnel.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
        {sideCard && <div className="lg:pt-2">{sideCard}</div>}
      </div>
    </section>
  );
}
