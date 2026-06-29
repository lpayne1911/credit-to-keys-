/**
 * PlanView — renders a Target Deal Sheet (Build My Plan result). Presentation
 * only; all numbers and copy come from the plan-engine.
 */
import type { TargetDealSheet, TargetFee } from "@/lib/plan-engine/types";

function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const FEE_KIND_LABEL: Record<TargetFee["kind"], { label: string; cls: string }> = {
  negotiable: { label: "Negotiable", cls: "bg-blue-soft text-blue-dark" },
  government: { label: "Government", cls: "bg-cream-100 text-slate" },
  varies: { label: "Confirm locally", cls: "bg-cream-100 text-slate" },
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
      <h2 className="text-sm font-bold uppercase tracking-wide text-blue">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function PlanView({ result }: { result: TargetDealSheet }) {
  const p = result.pricing;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue">Target Deal Sheet™</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy">{result.vehicleLabel}</h1>
      </div>

      {/* Target price */}
      <Card title="Target price">
        {p.targetPrice != null ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-navy">{money(p.targetPrice)}</p>
                <p className="mt-0.5 text-sm text-slate">Realistically achievable vehicle price — not sticker.</p>
              </div>
              <span className="rounded-full bg-blue-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-dark">
                {p.confidence} confidence
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-cream-100 px-2 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Low</p>
                <p className="mt-0.5 font-bold text-navy">{money(p.marketLow)}</p>
              </div>
              <div className="rounded-xl bg-cream-100 px-2 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Median</p>
                <p className="mt-0.5 font-bold text-navy">{money(p.marketMedian)}</p>
              </div>
              <div className="rounded-xl bg-cream-100 px-2 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">High</p>
                <p className="mt-0.5 font-bold text-navy">{money(p.marketHigh)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate">
              {p.basis}
              {p.isEstimate && " (demo estimate — a live lookup sharpens this.)"}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate">
            Add the vehicle and your ZIP to benchmark a local target price.
          </p>
        )}
      </Card>

      {/* Fee checklist */}
      <Card title="Expected fees">
        <ul className="space-y-3">
          {result.fees.map((f) => {
            const k = FEE_KIND_LABEL[f.kind];
            return (
              <li key={f.label} className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-navy">{f.label}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${k.cls}`}>{k.label}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate">{f.note}</p>
                </div>
                {f.target != null && (
                  <span className="shrink-0 text-sm font-bold text-navy">≤ {money(f.target)}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Financing */}
      {result.financing && (
        <Card title="Financing benchmark">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-slate">Estimated payment</p>
              <p className="text-2xl font-extrabold tracking-tight text-navy">
                {result.financing.estMonthlyLow != null
                  ? `${money(result.financing.estMonthlyLow)}–${money(result.financing.estMonthlyHigh)}/mo`
                  : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate">Target APR</p>
              <p className="font-bold text-navy">
                {result.financing.aprBand.low}%–{result.financing.aprBand.high}%
              </p>
            </div>
          </div>
          {result.financing.estPrincipal != null && (
            <p className="mt-2 text-sm text-slate">
              Financed: about {money(result.financing.estPrincipal)} over {result.financing.termMonths} months.
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-slate">{result.financing.note}</p>
        </Card>
      )}

      {/* Game plan */}
      <Card title="Negotiation game plan">
        <ol className="space-y-3">
          {result.gamePlan.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue text-sm font-bold text-white">
                {s.n}
              </span>
              <div>
                <p className="font-semibold text-navy">{s.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Scripts */}
      <Card title="What to say">
        <ul className="space-y-3">
          {result.scripts.map((s, i) => (
            <li key={i} className="rounded-xl bg-cream-100 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue">{s.heading}</p>
              <p className="mt-1 text-sm italic leading-relaxed text-navy">&ldquo;{s.say}&rdquo;</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Sharpen */}
      {result.missing.length > 0 && (
        <section className="rounded-2xl border border-blue/20 bg-blue-soft px-5 py-4">
          <p className="text-sm font-bold text-blue-dark">Sharpen your plan</p>
          <ul className="mt-2 space-y-1">
            {result.missing.map((m, i) => (
              <li key={i} className="text-sm text-navy/70">• {m}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
