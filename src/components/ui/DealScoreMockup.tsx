"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RiskBadge } from "./RiskBadge";

const TARGET = 64;

const RISK_FLAGS: { label: string; tone: "warning" | "danger" }[] = [
  { label: "Dealer fee padding", tone: "warning" },
  { label: "APR / payment mismatch", tone: "danger" },
  { label: "Warranty markup risk", tone: "warning" },
  { label: "Trade equity concern", tone: "warning" },
];

/**
 * The hero dashboard mockup — a large, premium "Deal Score" report card. The
 * score counts up from 0 and the gauge marker slides into place the first time
 * the card is on screen. Reduced-motion users get the final state instantly.
 */
export function DealScoreMockup() {
  const [score, setScore] = useState(0);
  const [animateGauge, setAnimateGauge] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setScore(TARGET);
      setAnimateGauge(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            setAnimateGauge(true);
            const duration = 1100;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              // easeOutCubic
              const eased = 1 - Math.pow(1 - p, 3);
              setScore(Math.round(eased * TARGET));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const markerPos = animateGauge ? Math.max(4, Math.min(96, TARGET)) : 4;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      {/* Glow behind the card. */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-gold/25 via-paleblue/40 to-transparent blur-2xl" />

      <div className="glass overflow-hidden rounded-[1.6rem] p-0">
        {/* Title bar — reads like an app window. */}
        <div className="flex items-center justify-between border-b border-navy/10 bg-white/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-flag-red/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-verdict-amber/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-flag-green/80" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
            Deal report
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            2021 Toyota Camry · sample
          </p>

          {/* Score + verdict */}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                Deal score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-6xl font-bold leading-none text-verdict-amber tabular-nums">
                  {score}
                </span>
                <span className="text-xl font-semibold text-navy/35">/100</span>
              </div>
            </div>
            <RiskBadge tone="warning" className="px-3 py-1.5 text-sm">
              Push back first
            </RiskBadge>
          </div>

          {/* Gauge */}
          <div className="mt-5">
            <div className="relative">
              <div className="h-3 rounded-full bg-gradient-to-r from-flag-red via-verdict-amber to-flag-green" />
              <div
                className="absolute -top-2 h-7 w-7 -translate-x-1/2 rounded-full border-[3px] border-white bg-navy shadow-card transition-[left] duration-1000 ease-out"
                style={{ left: `${markerPos}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-2.5 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-navy/45">
              <span>Walk away</span>
              <span>Caution</span>
              <span>Looks fair</span>
            </div>
          </div>

          {/* Savings */}
          <div className="mt-5 rounded-xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-paleblue/40 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
              Potential savings spotted
            </p>
            <p className="font-serif text-2xl font-bold text-gold-dark">
              $1,400–$2,900
            </p>
          </div>

          {/* Risk flags */}
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
              Risk flags
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RISK_FLAGS.map((f) => (
                <RiskBadge key={f.label} tone={f.tone}>
                  {f.label}
                </RiskBadge>
              ))}
            </div>
          </div>

          {/* In-mockup CTA — this is a SAMPLE, so it opens the sample report
              rather than implying it will generate the visitor's own script. */}
          <Link href="/sample" className="btn-secondary mt-5 w-full text-sm">
            See a sample pushback script
          </Link>
        </div>
      </div>
    </div>
  );
}
