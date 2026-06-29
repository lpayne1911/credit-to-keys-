import Link from "next/link";
import { recommendServices } from "./recommend";
import type { FairnessResult } from "@/lib/fairness-engine";

/**
 * Soft-paywall recommendations block — the "go deeper / get an advocate" nudge
 * under a verdict. NON-BLOCKING by design: the free report above is unchanged;
 * this only recommends paid advocacy services. It is deliberately distinct from
 * the free focused-check grid (VerdictNextSteps) so no CTA appears twice.
 */
export function VerdictRecommendations({ result }: { result: FairnessResult | null }) {
  const recs = recommendServices(result);
  if (recs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-4 shadow-card">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate">
        Want an advocate in your corner?
      </p>
      <div className="space-y-2">
        {recs.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="flex items-center justify-between gap-3 rounded-xl border border-navy/15 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-navy">{r.label}</span>
              <span className="block text-xs text-slate">{r.reason}</span>
            </span>
            <span aria-hidden className="shrink-0 text-gold-dark">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
