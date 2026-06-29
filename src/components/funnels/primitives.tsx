import Link from "next/link";
import type { ReactNode } from "react";
import { ACCENT_CLASSES, type Accent, type Deliverable } from "@/lib/funnels";
import { FunnelIcon } from "./icons";

/** Small "SAMPLE" tag for all mock data, so nothing reads as a real result. */
export function SampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy/70 ${className}`}
    >
      Sample
    </span>
  );
}

/** A diagnostic risk row ("Market Price: High"). Tones are risk-only, never gold. */
export function RiskFlagPill({
  label,
  level,
}: {
  label: string;
  level: "High" | "Medium" | "Low";
}) {
  const tone =
    level === "High"
      ? "bg-red-soft text-red-dark"
      : level === "Medium"
        ? "bg-orange-soft text-orange"
        : "bg-green-soft text-green-dark";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-edge py-2 last:border-0">
      <span className="text-sm text-ink">{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{level}</span>
    </div>
  );
}

/** "What you'll receive" tile. */
export function DeliverableCard({ item, accent }: { item: Deliverable; accent: Accent }) {
  const a = ACCENT_CLASSES[accent];
  return (
    <div className="flex h-full flex-col rounded-xl border border-edge bg-white p-5 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.soft} ${a.softText}`}>
        <FunnelIcon name={item.icon} />
      </span>
      <p className="mt-3 text-sm font-bold text-ink">{item.label}</p>
      {item.blurb && <p className="mt-1 text-sm leading-relaxed text-slate">{item.blurb}</p>}
    </div>
  );
}

/** Reusable 4-item trust strip (dark navy). */
const TRUST = [
  "We work for you. Not the dealer.",
  "No commissions. No kickbacks.",
  "Your data is secure and private.",
  "Real guidance. No runaround.",
];

export function TrustBar() {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-30" />
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M12 3 5 5.5V11c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V5.5L12 3Z" />
                <path d="M9 12l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-white/85">{t}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Dark navy CTA band with an accent-colored button. */
export function CTASection({
  accent,
  headline,
  body,
  cta,
  href,
  onClickHash,
}: {
  accent: Accent;
  headline: string;
  body?: string;
  cta: string;
  href: string;
  onClickHash?: boolean;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-14 text-center sm:py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{headline}</h2>
        {body && <p className="max-w-xl text-white/75">{body}</p>}
        <Link href={href} className={`${a.btn} text-base`}>
          {cta}
        </Link>
      </div>
    </section>
  );
}

/** Pricing card with included bullets + optional add-on. */
export function PricingCard({
  accent,
  label,
  amount,
  sub,
  bullets,
  addOn,
  cta,
  href,
}: {
  accent: Accent;
  label: string;
  amount: string;
  sub?: string;
  bullets?: string[];
  addOn?: { label: string; amount: string; sub?: string };
  cta: string;
  href: string;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="rounded-2xl border border-edge bg-white p-6 shadow-card">
        <p className="text-sm font-semibold text-slate">{label}</p>
        <p className={`mt-1 text-4xl font-extrabold tracking-tight ${a.text}`}>{amount}</p>
        {sub && <p className="mt-1 text-sm text-slate">{sub}</p>}
        {bullets && (
          <ul className="mt-4 space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-ink">
                <Check accent={accent} /> {b}
              </li>
            ))}
          </ul>
        )}
        <Link href={href} className={`${a.btn} mt-6 w-full text-sm`}>
          {cta}
        </Link>
      </div>
      {addOn && (
        <div className="rounded-2xl border border-dashed border-edge-strong bg-cream-100 p-6">
          <p className="text-sm font-semibold text-slate">{addOn.label}</p>
          <p className={`mt-1 text-3xl font-extrabold tracking-tight ${a.text}`}>{addOn.amount}</p>
          {addOn.sub && <p className="mt-2 text-sm leading-relaxed text-slate">{addOn.sub}</p>}
          <p className="mt-4 text-xs text-slate">Optional upgrade — added only if you choose it.</p>
        </div>
      )}
    </div>
  );
}

export function Check({ accent }: { accent: Accent }) {
  const a = ACCENT_CLASSES[accent];
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${a.soft} ${a.softText}`}>
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" aria-hidden>
        <path d="M5 10.5l2.5 2.5L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Section heading helper. */
export function SectionHeading({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy sm:text-3xl">{children}</h2>
      {sub && <p className="mt-2 max-w-2xl text-slate">{sub}</p>}
    </div>
  );
}
