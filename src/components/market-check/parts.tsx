import type { MarketStatus, PriceTrendPoint } from "@/lib/sources/marketcheck/types";
import { buildPriceDistribution } from "@/lib/market-engine/signals";

export function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const STATUS_STYLE: Record<MarketStatus, { label: string; cls: string }> = {
  below_market: { label: "Below market", cls: "bg-green-soft text-green-dark" },
  fair_market: { label: "Fair market", cls: "bg-green-soft text-green-dark" },
  slightly_above_market: { label: "Slightly above market", cls: "bg-orange-soft text-orange" },
  above_market: { label: "Above market", cls: "bg-orange-soft text-orange" },
  high_over_market: { label: "High over market", cls: "bg-red-soft text-red-dark" },
  insufficient_data: { label: "Not enough comps", cls: "bg-navy/8 text-navy/60" },
};

export function MarketStatusBadge({ status }: { status: MarketStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-edge bg-white p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 text-lg font-extrabold tracking-tight text-navy">{value}</p>
      {sub && <p className="text-[11px] text-slate">{sub}</p>}
    </div>
  );
}

/** Low–median–high market band with the buyer's price marker. */
export function MarketGauge({
  low,
  median,
  high,
  price,
}: {
  low: number | null;
  median: number | null;
  high: number | null;
  price: number | null;
}) {
  if (low == null || high == null || high <= low) {
    return <p className="text-sm text-slate">Not enough comparable listings to plot a range.</p>;
  }
  const pct = (v: number) => Math.max(2, Math.min(98, ((v - low) / (high - low)) * 100));
  const medianPos = median != null ? pct(median) : null;
  const pricePos = price != null ? pct(price) : null;
  return (
    <div className="pt-7">
      <div className="relative">
        <div className="h-2.5 rounded-full bg-gradient-to-r from-green via-orange to-red" />
        {medianPos != null && (
          <div className="absolute -top-1 h-4.5 w-[3px] -translate-x-1/2 rounded bg-navy/70" style={{ left: `${medianPos}%`, height: "1.1rem" }} aria-hidden />
        )}
        {pricePos != null && (
          <div className="absolute -top-2 -translate-x-1/2" style={{ left: `${pricePos}%` }}>
            <div className="h-6 w-6 rounded-full border-[3px] border-white bg-navy shadow-card" aria-hidden />
            <span className="absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap rounded-md border border-edge bg-white px-2 py-0.5 text-[11px] font-bold text-navy shadow-sm">
              You: {money(price)}
            </span>
          </div>
        )}
      </div>
      <div className="mt-2.5 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-navy/50">
        <span>{money(low)}<br />Low</span>
        <span className="text-center">{money(median)}<br />Median</span>
        <span className="text-right">{money(high)}<br />High</span>
      </div>
    </div>
  );
}

/** Histogram of nearby comparable-listing prices, with median + your-price
 *  markers. Real data from the comps we already fetched — shown when no
 *  time-series history is available, instead of a fabricated trend. */
export function PriceDistributionChart({
  prices,
  median,
  price,
}: {
  prices: number[];
  median: number | null;
  price: number | null;
}) {
  const buckets = buildPriceDistribution(prices, 6);
  if (buckets.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-edge bg-cream-50 text-sm text-slate">
        Not enough comparable listings to chart a distribution.
      </div>
    );
  }
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const lo = buckets[0].lowEdge;
  const hi = buckets[buckets.length - 1].highEdge;
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  return (
    <div>
      <div className="relative flex h-32 items-end gap-1">
        {buckets.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end">
            {b.count > 0 && <span className="text-[10px] font-semibold text-slate">{b.count}</span>}
            <div
              className="w-full rounded-t bg-blue/70"
              style={{ height: `${Math.round((b.count / maxCount) * 100)}%` }}
            />
          </div>
        ))}
        {median != null && (
          <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-navy/70" style={{ left: `${pos(median)}%` }} aria-hidden />
        )}
        {price != null && (
          <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-red" style={{ left: `${pos(price)}%` }} aria-hidden />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-slate">
        <span>{money(lo)}</span>
        <span>{money(hi)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate">
        {median != null && (
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-navy/70" />Median {money(median)}</span>
        )}
        {price != null && (
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-red" />Your price {money(price)}</span>
        )}
      </div>
    </div>
  );
}

/** Inline-SVG 60-day price trend (no chart dependency). */
export function PriceTrendChart({ points }: { points: PriceTrendPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-edge bg-cream-50 text-sm text-slate">
        Trend history isn&apos;t available for this vehicle yet.
      </div>
    );
  }
  const W = 600;
  const H = 180;
  const pad = 8;
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(1, max - min);
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const mid = Math.floor((points.length - 1) / 2);
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex w-9 shrink-0 flex-col justify-between py-1 text-right text-[10px] font-semibold text-slate">
          <span>{money(max)}</span>
          <span>{money(min)}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label="60-day price trend">
          <defs>
            <linearGradient id="mc-trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0E4D8A" stopOpacity="0.18" />
              <stop offset="1" stopColor="#0E4D8A" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#mc-trend)" />
          <path d={line} fill="none" stroke="#0E4D8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.price)} r="3" fill="#0E4D8A" />
          ))}
        </svg>
      </div>
      <div className="ml-9 mt-1 flex justify-between text-[10px] font-medium text-slate">
        <span>{fmtDate(points[0].date)}</span>
        <span>{fmtDate(points[mid].date)}</span>
        <span>{fmtDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
