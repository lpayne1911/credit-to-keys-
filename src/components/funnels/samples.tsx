import { SampleBadge, RiskFlagPill } from "./primitives";

/**
 * SAMPLE deliverable cards — one per funnel. All figures are illustrative and
 * carry a SampleBadge so nothing reads as a real result. Copy follows the
 * compliance rules (potential savings / estimate range / no guarantees).
 */

/* 🟢 Deal Review Summary */
export function DealReviewSummarySample() {
  return (
    <div className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate">Deal Review Summary</p>
        <SampleBadge />
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-bold text-ink">2024 Toyota RAV4 XLE AWD</p>
          <p className="text-xs text-slate">VIN JTMWFREV0RD123456 · Quote May 14, 2024</p>
          <div className="mt-3 rounded-xl bg-cream-100 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Dealer asking price</p>
            <p className="text-3xl font-extrabold tracking-tight text-navy">$32,250</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate">Estimated market range</p>
            <p className="text-lg font-bold text-green">$31,200 – $31,800</p>
            <p className="text-sm font-semibold text-red-dark">+$450 over market (1.4%)</p>
          </div>
        </div>
        <div>
          <RiskFlagPill label="Junk fees detected — $1,241" level="High" />
          <RiskFlagPill label="Overpricing vs. market — +$450" level="Medium" />
          <RiskFlagPill label="APR mismatch — +1.2%" level="High" />
          <RiskFlagPill label="Payment structure — +$92/mo" level="Medium" />
          <RiskFlagPill label="Vehicle price in range, incentives applied" level="Low" />
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-green-soft px-4 py-3 text-sm text-green-dark">
        <span className="font-bold">Bottom line:</span> potential savings of $1,500+ with the
        right strategy. You make the final decision.
      </div>
    </div>
  );
}

/* 🔵 Target Deal Sheet */
export function TargetDealSheetSample() {
  return (
    <div className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate">Target Deal Sheet™</p>
        <SampleBadge />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-cream-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Target vehicle</p>
          <p className="text-sm font-bold text-ink">2024 Toyota RAV4 XLE AWD</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate">Out-the-door target</p>
          <p className="text-3xl font-extrabold tracking-tight text-blue">$32,250</p>
        </div>
        <div className="rounded-xl border border-edge p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-green-dark">Fees — legit</p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate">
            <li className="flex justify-between"><span>Doc fee (state limit)</span><span className="font-semibold text-ink">$0</span></li>
            <li className="flex justify-between"><span>Title</span><span className="font-semibold text-ink">$15</span></li>
            <li className="flex justify-between"><span>Reg / tags</span><span className="font-semibold text-ink">$125</span></li>
            <li className="flex justify-between border-t border-edge pt-1"><span>Total legit fees</span><span className="font-bold text-ink">$190</span></li>
          </ul>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-red-dark">Fees — often junk</p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate">
            <li className="flex justify-between"><span>Market adjustment</span><span className="font-semibold text-red">$0</span></li>
            <li className="flex justify-between"><span>Protection package</span><span className="font-semibold text-red">$0</span></li>
            <li className="flex justify-between"><span>Nitrogen / LoJack</span><span className="font-semibold text-red">$0</span></li>
          </ul>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Trade-in target" value="$15,500" tone="text-green" />
        <Stat label="Financing benchmark" value="5.49% / 60mo" tone="text-blue" />
        <Stat label="Walk-away number" value="$33,200" tone="text-red" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-edge bg-cream-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className={`text-sm font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

/* 🟡 Concierge sample timeline */
const TIMELINE = [
  ["Application", "Day 1"],
  ["Discovery call", "Day 1"],
  ["Sourcing & comparison", "Days 2–3"],
  ["Dealer negotiation", "Days 3–5"],
  ["Paperwork review", "Days 5–6"],
  ["Delivery coordination", "Days 6–8"],
];

export function ConciergeTimelineSample() {
  return (
    <div className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate">Sample timeline</p>
        <SampleBadge />
      </div>
      <ul className="mt-4 space-y-0">
        {TIMELINE.map(([label, day], i) => (
          <li key={label} className="flex items-center gap-3 border-b border-edge py-2.5 last:border-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold-dark">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
            <span className="text-xs font-semibold text-slate">{day}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate">
        Typical timeline: 5–8 business days. Timeline varies based on vehicle, market, lender,
        dealer, and buyer circumstances.
      </p>
    </div>
  );
}

/* 🔴 Post-Sale Options Map */
const OPTIONS: { area: string; status: string; action: string; tone: "review" | "unlikely" }[] = [
  { area: "Vehicle Service Contract (VSC)", status: "Review", action: "Possible cancel", tone: "review" },
  { area: "GAP insurance", status: "Review", action: "Possible cancel", tone: "review" },
  { area: "Paint protection / coating", status: "Likely non-refundable", action: "Unlikely cancellation", tone: "unlikely" },
  { area: "Window tint", status: "Review", action: "Possible cancel", tone: "review" },
  { area: "Documentation fee", status: "Likely non-refundable", action: "Unlikely refund", tone: "unlikely" },
  { area: "Lender add-on product", status: "Review", action: "Check with lender", tone: "review" },
];

export function PostSaleOptionsMapSample() {
  return (
    <div className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate">Post-Sale Options Map</p>
        <SampleBadge />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-edge">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-100 text-[11px] font-bold uppercase tracking-wide text-slate">
            <tr>
              <th className="px-3 py-2">Issue / area</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Potential action</th>
            </tr>
          </thead>
          <tbody>
            {OPTIONS.map((o) => (
              <tr key={o.area} className="border-t border-edge">
                <td className="px-3 py-2.5 font-medium text-ink">{o.area}</td>
                <td className={`px-3 py-2.5 font-semibold ${o.tone === "review" ? "text-orange" : "text-slate"}`}>{o.status}</td>
                <td className="px-3 py-2.5 text-slate">{o.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate">
        Outcomes vary. We review your documents to confirm details. Post-sale results cannot be
        guaranteed.
      </p>
    </div>
  );
}
