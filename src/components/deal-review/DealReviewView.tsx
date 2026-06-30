/**
 * Deal Review — buyer-facing result view for the Quote Review flow.
 *
 * Renders a {@link DealReviewResult} (built by the pure deal engine) into the
 * sections required by the increment: Deal Score, vehicle summary, MarketCheck
 * snapshot, paperwork summary, fee breakdown, add-on / F&I review, APR/payment
 * check, trade-in review, Contract mismatch signals, Driveway Advocate
 * Takeaways, pushback script, and a CTA panel.
 *
 * Design rules mirrored from VerdictView: red/amber/green are diagnostic cues
 * only (never on buttons); every estimate shows a range + confidence. Copy is
 * decision-support — no legal conclusions, no guarantees.
 */
import Link from "next/link";
import {
  ConfidenceBadge,
  RangePill,
  VerdictGauge,
} from "@/components/VerdictView";
import { AnimatedScore } from "@/components/ui/AnimatedScore";
import { RiskBadge, type RiskTone } from "@/components/ui/RiskBadge";
import type { DealReviewResult, RiskSeverity } from "@/lib/deal-engine/types";
import type { FeeAssessmentLevel } from "@/lib/fee-engine/types";
import { DealReviewScriptCard } from "./DealReviewScriptCard";

function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  used: "Used",
  cpo: "Certified pre-owned",
  demo: "Demo",
  rental: "Previous rental",
};

function titleCase(s: string): string {
  return CONDITION_LABELS[s.toLowerCase()] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

function Section({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-navy/55">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-navy/60">{label}</span>
      <span className="text-sm font-semibold text-navy">{value}</span>
    </div>
  );
}

function severityTone(severity: RiskSeverity): RiskTone {
  return severity === "high"
    ? "danger"
    : severity === "medium"
      ? "warning"
      : severity === "low"
        ? "neutral"
        : "info";
}

const FEE_LEVEL: Record<FeeAssessmentLevel, { tone: RiskTone; label: string }> = {
  likely_legitimate: { tone: "safe", label: "Likely legitimate" },
  state_dependent: { tone: "info", label: "State-dependent" },
  questionable: { tone: "warning", label: "Questionable" },
  likely_negotiable: { tone: "warning", label: "Likely negotiable" },
  likely_junk: { tone: "danger", label: "Likely junk" },
  unknown: { tone: "neutral", label: "Needs clarification" },
};

function scoreTone(score: number): RiskTone {
  return score >= 80 ? "safe" : score >= 55 ? "warning" : "danger";
}

export function DealReviewView({ result }: { result: DealReviewResult }) {
  const { normalized: deal, math, marketValue } = result;

  return (
    <div className="space-y-6">
      {/* ---- Deal Score ---------------------------------------------------- */}
      <section className="card text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
          Deal Review
        </p>
        <h1 className="mt-1 font-serif text-xl font-semibold text-navy">
          {result.vehicleLabel}
        </h1>
        <div className="mt-4 flex items-end justify-center gap-1">
          <AnimatedScore
            value={result.dealScore}
            className={`font-serif text-6xl font-bold ${
              result.dealScore >= 80
                ? "text-verdict-green"
                : result.dealScore >= 55
                  ? "text-verdict-amber"
                  : "text-verdict-red"
            }`}
          />
          <span className="pb-2 text-lg text-navy/40">/ 100</span>
        </div>
        <VerdictGauge score={result.dealScore} />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <RiskBadge tone={scoreTone(result.dealScore)}>
            {result.riskFlags.length} risk signal
            {result.riskFlags.length === 1 ? "" : "s"}
          </RiskBadge>
          <ConfidenceBadge level={result.confidence} />
        </div>
        {result.confidenceReasons.length ? (
          <p className="mx-auto mt-3 max-w-sm text-xs text-navy/50">
            {result.confidenceReasons.join(" ")}
          </p>
        ) : null}
      </section>

      {/* ---- Vehicle summary ---------------------------------------------- */}
      <Section title="Vehicle summary">
        <div className="divide-y divide-navy/5">
          <Row
            label="Vehicle"
            value={result.vehicleLabel}
          />
          {deal.vehicle.condition ? (
            <Row label="Condition" value={titleCase(deal.vehicle.condition)} />
          ) : null}
          {deal.vehicle.color ? <Row label="Color" value={deal.vehicle.color} /> : null}
          {deal.vehicle.mileage != null ? (
            <Row label="Mileage" value={`${deal.vehicle.mileage.toLocaleString()} mi`} />
          ) : null}
          {deal.vehicle.vin ? <Row label="VIN" value={deal.vehicle.vin} /> : null}
        </div>
      </Section>

      {/* ---- Dealer & sale ------------------------------------------------ */}
      {deal.sourceMetadata.dealerName ||
      deal.sourceMetadata.dealerAddress ||
      deal.sourceMetadata.dealerPhone ||
      deal.sourceMetadata.salesperson ||
      deal.sourceMetadata.stockNumber ||
      deal.sourceMetadata.buyerState ? (
        <Section title="Dealer & sale">
          <div className="divide-y divide-navy/5">
            {deal.sourceMetadata.dealerName ? (
              <Row label="Dealer" value={deal.sourceMetadata.dealerName} />
            ) : null}
            {deal.sourceMetadata.dealerAddress ? (
              <Row label="Address" value={deal.sourceMetadata.dealerAddress} />
            ) : null}
            {deal.sourceMetadata.dealerPhone ? (
              <Row label="Phone" value={deal.sourceMetadata.dealerPhone} />
            ) : null}
            {deal.sourceMetadata.salesperson ? (
              <Row label="Salesperson" value={deal.sourceMetadata.salesperson} />
            ) : null}
            {deal.sourceMetadata.stockNumber ? (
              <Row label="Stock #" value={deal.sourceMetadata.stockNumber} />
            ) : null}
            {deal.sourceMetadata.buyerState ? (
              <Row label="State" value={deal.sourceMetadata.buyerState} />
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ---- MarketCheck snapshot (only when available) -------------------- */}
      {marketValue ? (
        <Section
          title="Market price snapshot"
          subtitle="Local comparable listings for this vehicle."
        >
          <RangePill range={marketValue} />
          {deal.pricing.vehiclePrice != null ? (
            <p className="mt-3 text-sm text-navy/70">
              Selling price{" "}
              <span className="font-semibold">{money(deal.pricing.vehiclePrice)}</span>{" "}
              {deal.pricing.vehiclePrice > marketValue.high
                ? "is above the local market band."
                : deal.pricing.vehiclePrice < marketValue.low
                  ? "is below the local market band."
                  : "sits within the local market band."}
            </p>
          ) : null}
        </Section>
      ) : (
        <Section title="Market price snapshot">
          <p className="text-sm text-navy/60">
            A local market band wasn&apos;t available for this vehicle, so the
            price check is lower confidence. Adding the year, make, model, and ZIP
            improves it.
          </p>
        </Section>
      )}

      {/* ---- Dealer paperwork summary ------------------------------------- */}
      <Section title="Dealer paperwork summary">
        <div className="divide-y divide-navy/5">
          <Row label="Selling price" value={money(deal.pricing.vehiclePrice)} />
          {deal.pricing.msrp != null ? <Row label="MSRP" value={money(deal.pricing.msrp)} /> : null}
          {deal.pricing.outTheDoor != null ? (
            <Row label="Out-the-door" value={money(deal.pricing.outTheDoor)} />
          ) : null}
          <Row label="Total fees" value={money(math.totalFees)} />
          <Row label="Total add-ons" value={money(math.totalAddOns)} />
          <Row label="Down payment" value={money(deal.pricing.downPayment)} />
          {deal.pricing.totalVehiclePrice != null ? (
            <Row label="Dealer-stated total" value={money(deal.pricing.totalVehiclePrice)} />
          ) : null}
          {deal.pricing.balanceDue != null ? (
            <Row label="Balance due (stated)" value={money(deal.pricing.balanceDue)} />
          ) : null}
          <Row label="Est. amount financed" value={money(math.estimatedAmountFinanced)} />
        </div>
        {(() => {
          // Cross-check our reconstructed financed amount against the figure the
          // dealer printed. A gap means a line was missed on one side — worth a
          // question before signing, not a verdict.
          const stated = deal.pricing.balanceDue;
          const ours = math.estimatedAmountFinanced;
          if (stated == null || ours == null) return null;
          const diff = Math.round(ours - stated);
          if (Math.abs(diff) < 50) {
            return (
              <p className="mt-3 text-sm text-navy/60">
                Our reconstructed amount financed matches the balance due printed on
                your order.
              </p>
            );
          }
          return (
            <p className="mt-3 rounded-lg bg-verdict-amber/10 px-3 py-2 text-sm text-navy/80">
              Our reconstructed amount financed is {money(Math.abs(diff))}{" "}
              {diff > 0 ? "more" : "less"} than the balance due printed on your order
              ({money(stated)}). Ask the dealer to itemize the difference before
              signing.
            </p>
          );
        })()}
      </Section>

      {/* ---- Fee Breakdown ------------------------------------------------ */}
      <Section title="Fee breakdown">
        {result.feeAssessments.length === 0 ? (
          <p className="text-sm text-navy/60">
            No itemized fees were provided. Request a buyer&apos;s order so every
            fee is listed separately.
          </p>
        ) : (
          <ul className="space-y-3">
            {result.feeAssessments.map((f, i) => {
              const meta = FEE_LEVEL[f.assessment];
              return (
                <li key={i} className="rounded-xl border border-navy/10 bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-navy">{f.rawLabel}</span>
                    <span className="font-semibold text-navy">{money(f.amount)}</span>
                  </div>
                  <div className="mt-2">
                    <RiskBadge tone={meta.tone} wrap>
                      {meta.label}
                    </RiskBadge>
                  </div>
                  <p className="mt-2 text-sm text-navy/70">{f.reason}</p>
                  {f.docFee?.sourceSummary && f.docFee.comparisonStatus !== "not_doc_fee" ? (
                    <p className="mt-1 text-xs text-navy/45">{f.docFee.sourceSummary}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-navy/60">
                    <span className="font-semibold">Ask: </span>
                    {f.suggestedAction}
                  </p>
                  {f.estimatedImpact ? (
                    <div className="mt-2">
                      <RangePill range={f.estimatedImpact} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* ---- Add-On / F&I Review ------------------------------------------ */}
      {result.addOnAssessments.length ? (
        <Section
          title="Add-on / F&I review"
          subtitle="Every product here is optional — declining one does not change the car's price."
        >
          <ul className="space-y-3">
            {result.addOnAssessments.map((a, i) => (
              <li key={i} className="rounded-xl border border-navy/10 bg-white/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-navy">{a.rawLabel}</span>
                  <span className="font-semibold text-navy">{money(a.amount)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <RiskBadge tone="info">Optional</RiskBadge>
                  {a.overpricedRisk ? <RiskBadge tone="warning">Overpriced risk</RiskBadge> : null}
                  {a.financedIntoLoan ? <RiskBadge tone="neutral">Financed into loan</RiskBadge> : null}
                  {a.cancellationTermsNeeded ? (
                    <RiskBadge tone="neutral">Get cancellation terms</RiskBadge>
                  ) : null}
                  {a.humanReviewRecommended ? (
                    <RiskBadge tone="verify">Human review suggested</RiskBadge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-navy/70">{a.reason}</p>
                <p className="mt-2 text-sm text-navy/60">
                  <span className="font-semibold">Ask: </span>
                  {a.suggestedAction}
                </p>
                {a.estimatedImpact ? (
                  <div className="mt-2">
                    <RangePill range={a.estimatedImpact} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* ---- APR / Payment Check ------------------------------------------ */}
      <Section title="APR / payment check">
        <div className="divide-y divide-navy/5">
          <Row label="APR" value={deal.finance.apr != null ? `${deal.finance.apr}%` : "—"} />
          <Row
            label="Term"
            value={deal.finance.termMonths != null ? `${deal.finance.termMonths} mo` : "—"}
          />
          <Row label="Dealer payment / mo" value={money(math.dealerMonthlyPayment)} />
          <Row label="Reconstructed payment / mo" value={money(math.expectedMonthlyPayment)} />
          {math.paymentDelta != null ? (
            <Row label="Difference / mo" value={money(Math.abs(math.paymentDelta))} />
          ) : null}
          {math.impliedApr != null ? (
            <Row label="Implied APR" value={`≈ ${math.impliedApr.toFixed(1)}%`} />
          ) : null}
        </div>
        {math.paymentMismatch ? (
          <p className="mt-3 rounded-lg bg-verdict-amber/10 px-3 py-2 text-sm text-navy/80">
            The payment does not reconcile with the APR, term, and amount financed
            provided. Ask for those three figures in writing so the monthly payment
            can be confirmed.
          </p>
        ) : math.expectedMonthlyPayment != null ? (
          <p className="mt-3 text-sm text-navy/60">
            The quoted payment is consistent with the APR, term, and amount
            financed we reconstructed.
          </p>
        ) : null}
        {math.aprBenchmark ? (
          <p className="mt-2 text-xs text-navy/45">
            APR benchmark is a placeholder ({math.aprBenchmark.low}–
            {math.aprBenchmark.high}%) until verified rate data is connected — treat
            it as low confidence.
          </p>
        ) : null}
      </Section>

      {/* ---- Trade-In Review (only when a trade exists) ------------------- */}
      {deal.trade ? (
        <Section title="Trade-in review">
          <div className="divide-y divide-navy/5">
            {(() => {
              const t = deal.trade;
              const label = [t.year, t.make, t.model].filter(Boolean).join(" ");
              return label ? <Row label="Trade vehicle" value={label} /> : null;
            })()}
            {deal.trade.mileage != null ? (
              <Row label="Trade mileage" value={`${deal.trade.mileage.toLocaleString()} mi`} />
            ) : null}
            <Row label="Dealer offer" value={money(deal.trade.offer)} />
            {deal.trade.estimatedValue != null ? (
              <Row label="Your researched value" value={money(deal.trade.estimatedValue)} />
            ) : null}
            <Row label="Loan payoff" value={money(deal.trade.loanPayoff)} />
            {math.tradeEquity != null ? (
              <Row
                label={math.tradeEquity >= 0 ? "Trade equity" : "Negative equity"}
                value={money(Math.abs(math.tradeEquity))}
              />
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ---- Contract mismatch signals ------------------------------------ */}
      <Section
        title="Contract mismatch signals"
        subtitle="Risk signals worth raising before you sign. Each is decision support, not a legal conclusion."
      >
        {result.riskFlags.length === 0 ? (
          <p className="text-sm text-navy/60">
            Nothing in what you provided tripped a risk signal. Confirm the
            out-the-door total in writing before signing.
          </p>
        ) : (
          <ul className="space-y-3">
            {result.riskFlags.map((f) => (
              <li key={f.id} className="rounded-xl border border-navy/10 bg-white/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-navy">{f.title}</span>
                  <RiskBadge tone={severityTone(f.severity)}>{f.severity}</RiskBadge>
                </div>
                <p className="mt-2 text-sm text-navy/70">{f.detail}</p>
                <p className="mt-2 text-sm text-navy/60">
                  <span className="font-semibold">Ask: </span>
                  {f.suggestedAction}
                </p>
                {f.estimatedImpact ? (
                  <div className="mt-2">
                    <RangePill range={f.estimatedImpact} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ---- Driveway Advocate Takeaways ---------------------------------- */}
      <Section title="Driveway Advocate takeaways">
        <ul className="space-y-2">
          {result.takeaways.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-navy/75">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-semibold text-navy/70">
          You make the final decision.
        </p>
      </Section>

      {/* ---- Pushback script ---------------------------------------------- */}
      <DealReviewScriptCard script={result.script} />

      {/* ---- CTA panel ---------------------------------------------------- */}
      <section className="glass p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate">
          What next?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/human-review"
            className="rounded-xl border border-navy/15 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
          >
            Request human review
          </Link>
          <Link
            href="/quote-review/intake"
            className="rounded-xl border border-navy/15 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
          >
            Generate another script
          </Link>
          <Link
            href="/build-my-plan"
            className="rounded-xl border border-navy/15 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
          >
            Build my plan
          </Link>
          <Link
            href="/dashboard/reports"
            className="rounded-xl border border-navy/15 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
          >
            Saved · View in My Reports
          </Link>
        </div>
      </section>

      {/* ---- Assumptions / compliance ------------------------------------- */}
      <details className="rounded-xl border border-navy/10 bg-white/50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-navy/70">
          How we got here (assumptions)
        </summary>
        <ul className="mt-3 space-y-1.5 text-xs text-navy/55">
          {result.assumptions.map((a, i) => (
            <li key={i}>• {a}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
