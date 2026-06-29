import Link from "next/link";
import type { MarketCheckResponse } from "@/lib/sources/marketcheck/types";
import { SampleBadge } from "@/components/funnels/primitives";
import { money, MarketStatusBadge, MarketGauge, PriceTrendChart, StatTile } from "./parts";
import { ComparableListingsTable } from "./ComparableListingsTable";

const CONF_LABEL = { low: "Low", medium: "Medium", high: "High" } as const;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        {hint && <span className="text-xs text-slate">{hint}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-edge py-2 text-sm last:border-0">
      <span className="text-slate">{k}</span>
      <span className="font-semibold text-ink">{v}</span>
    </div>
  );
}

export function MarketCheckReport({ response }: { response: MarketCheckResponse }) {
  const { vehicle: v, snapshot: s, comparableListings, trend, dealerInsight, takeaways, source } = response;
  const name = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
  const pulledAt = new Date(source.fetchedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* MAIN COLUMN */}
        <div className="space-y-6">
          {/* Vehicle header */}
          <section className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-start gap-5">
              <VehicleImage />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-navy">{name}</h1>
                  {source.isMock && <SampleBadge />}
                </div>
                {v.vin && (
                  <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-cream-100 px-2 py-1 font-mono text-xs text-navy/70">
                    VIN: {v.vin}
                  </p>
                )}
                <p className="mt-2 text-sm text-slate">
                  {v.trim ? `Trim: ${v.trim}` : ""}
                  {v.mileage ? `  ·  ${v.mileage.toLocaleString()} mi` : ""}
                  {s.searchParams.zipCode ? `  ·  ${s.searchParams.zipCode} (${s.searchParams.radiusMiles ?? 75} mi)` : ""}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-dark">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-soft">✓</span>
                  MarketCheck data pulled · {pulledAt}
                </p>
              </div>
              <div className="shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Market status</p>
                <div className="mt-1"><MarketStatusBadge status={s.marketStatus} /></div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate">Confidence</p>
                <p className="text-sm font-bold text-navy">{CONF_LABEL[s.confidence.level]}</p>
                <ConfidenceBar level={s.confidence.level} />
              </div>
            </div>
          </section>

          {/* Market Price Snapshot */}
          <Section
            title="Market Price Snapshot"
            hint={`Based on ${s.comparableCount} comparable listings within ${s.searchParams.radiusMiles ?? 75} miles`}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Figure label="Dealer asking" value={money(s.dealerAskingPrice)} tone="navy" />
              <Figure label="Market range" value={`${money(s.marketLow)}–${money(s.marketHigh)}`} tone="navy" small />
              <Figure label="Market median" value={money(s.marketMedian)} tone="navy" />
              <Figure label="Target price" value={money(s.targetPrice)} tone="green" />
              <Figure
                label="Vs. market"
                value={s.differenceVsMedian != null ? `${s.differenceVsMedian >= 0 ? "+" : ""}${money(s.differenceVsMedian)}` : "—"}
                tone={s.differenceVsMedian != null && s.differenceVsMedian > 0 ? "red" : "green"}
                sub={s.differencePercent != null ? `${s.differencePercent >= 0 ? "+" : ""}${s.differencePercent}% vs median` : undefined}
              />
            </div>
            <div className="mt-4">
              <MarketGauge low={s.marketLow} median={s.marketMedian} high={s.marketHigh} price={s.dealerAskingPrice ?? null} />
            </div>
          </Section>

          {/* Comparable listings */}
          <Section title="Comparable Listings">
            <ComparableListingsTable comps={comparableListings} />
          </Section>

          {/* Identity + dealer intel */}
          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Vehicle Identity & Equipment">
              <div className="space-y-0">
                <KV k="Trim" v={v.trim ?? "—"} />
                <KV k="Drivetrain" v={v.drivetrain ?? "—"} />
                <KV k="Engine" v={v.engine ?? "—"} />
                <KV k="Transmission" v={v.transmission ?? "—"} />
                <KV k="Fuel type" v={v.fuelType ?? "—"} />
                <KV k="Body style" v={v.bodyStyle ?? "—"} />
                <KV k="Estimated MSRP" v={money(v.msrp)} />
              </div>
              {v.keyFeatures && v.keyFeatures.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {v.keyFeatures.map((f) => (
                    <span key={f} className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-navy/70">{f}</span>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Dealer / Inventory Intelligence">
              <div className="space-y-0">
                <KV k="Similar at this dealer" v={dealerInsight?.similarAtDealer != null ? `${dealerInsight.similarAtDealer} vehicles` : "—"} />
                <KV k="Avg price at this dealer" v={money(dealerInsight?.avgPriceAtDealer)} />
                <KV k="This listing — days on market" v={dealerInsight?.thisListingDaysOnMarket != null ? `${dealerInsight.thisListingDaysOnMarket} days` : "—"} />
                <KV k="Price rank at dealer" v={dealerInsight?.priceRankAtDealer ? `${dealerInsight.priceRankAtDealer.rank} of ${dealerInsight.priceRankAtDealer.of}` : "—"} />
                <KV k="Local competition" v={dealerInsight?.localCompetition ? dealerInsight.localCompetition[0].toUpperCase() + dealerInsight.localCompetition.slice(1) : "—"} />
              </div>
              {dealerInsight?.insight && (
                <p className="mt-3 rounded-lg bg-orange-soft px-3 py-2 text-xs leading-relaxed text-ink">
                  <span className="font-bold text-orange">Insight: </span>{dealerInsight.insight}
                </p>
              )}
            </Section>
          </div>

          {/* Takeaways */}
          <Section title="Driveway Advocate Takeaways">
            <ul className="space-y-3">
              {takeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-soft text-xs font-bold text-blue-dark">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* RIGHT RAIL */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-navy">What would you like to do next?</h2>
            <div className="mt-4 space-y-2.5">
              <Link href="/quote-review" className="btn-green w-full text-sm">Review My Quote</Link>
              <Link href="/build-my-plan" className="btn-blue w-full text-sm">Build My Plan</Link>
              <Link href="/human-review" className="btn-secondary w-full justify-center text-sm">Request Human Review</Link>
            </div>
            <p className="mt-3 text-center text-xs text-slate">
              Market data is one part of the deal — compare it to your actual paperwork.
            </p>
          </section>

          <Section title="Price History & Market Trend">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate">Price trend (60 days)</span>
              <span className="rounded-lg border border-edge bg-white px-2.5 py-1 text-xs font-semibold text-navy">60 Days ▾</span>
            </div>
            <PriceTrendChart points={trend.points} />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <StatTile label="Avg days on market" value={String(trend.avgDaysOnMarket)} sub={trend.avgDomNote} />
              <StatTile label="Active listings" value={String(trend.activeListings)} sub={trend.activeListingsNote} />
              <StatTile label="Price drops (7d)" value={String(trend.priceDrops7d)} sub={trend.priceDropsNote} />
              <StatTile label="Best nearby deal" value={money(trend.bestNearbyDeal)} sub={trend.bestNearbyDistanceMiles != null ? `${trend.bestNearbyDistanceMiles} mi away` : undefined} />
            </div>
          </Section>

          <Section title={`Market Summary (${s.searchParams.radiusMiles ?? 75} mi radius)`}>
            <div className="space-y-0">
              <KV k="Market status" v={cap(s.marketStatus.replace(/_/g, " "))} />
              <KV k="Price trend" v={cap(trend.trendDirection)} />
              <KV k="Supply level" v={cap(trend.supplyLevel)} />
              <KV k="Demand level" v={cap(trend.demandLevel)} />
              {trend.seasonality && <KV k="Seasonality impact" v={trend.seasonality} />}
              {trend.bestTimeToBuy && <KV k="Best time to buy" v={trend.bestTimeToBuy} />}
            </div>
            <p className="mt-3 text-sm font-bold text-blue">How MarketCheck works →</p>
          </Section>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-6xl text-center text-xs leading-relaxed text-slate">
        MarketCheck data is aggregated from multiple sources and may not reflect real-time
        dealer changes — always verify details with the dealer. This is a market benchmark
        based on available comparable listings, not an exact appraisal. You make the final
        decision. <span className="font-semibold text-navy/70">Data provided by MarketCheck.</span>
      </p>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function VehicleImage() {
  return (
    <div className="flex h-28 w-44 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 to-cream-200 ring-1 ring-edge">
      <svg viewBox="0 0 64 32" className="h-16 w-32 text-navy/30" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 22l3-8a4 4 0 0 1 3.7-2.5h28A4 4 0 0 1 46 14l4 6 8 1.5V24H4z" />
        <circle cx="16" cy="24" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="46" cy="24" r="3.5" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

function ConfidenceBar({ level }: { level: "low" | "medium" | "high" }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <div className="mt-1.5 flex w-28 gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-green" : "bg-edge"}`} />
      ))}
    </div>
  );
}

function Figure({
  label,
  value,
  tone,
  sub,
  small,
}: {
  label: string;
  value: string;
  tone: "navy" | "green" | "red";
  sub?: string;
  small?: boolean;
}) {
  const color = tone === "green" ? "text-green" : tone === "red" ? "text-red-dark" : "text-navy";
  return (
    <div className="rounded-xl bg-cream-100 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate">{label}</p>
      <p className={`mt-1 font-extrabold tracking-tight ${color} ${small ? "text-sm" : "text-lg"}`}>{value}</p>
      {sub && <p className="text-[10px] font-medium text-slate">{sub}</p>}
    </div>
  );
}
