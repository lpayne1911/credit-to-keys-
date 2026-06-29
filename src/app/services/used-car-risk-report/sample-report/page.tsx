import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import {
  SAMPLE_USED_CAR_RISK_REPORT,
  REPORT_RECOMMENDATION_DISPLAY,
  REPORT_SEVERITY_DISPLAY,
  type ReportSeverity,
} from "@/lib/used-car-risk-report";

export const metadata = {
  title: "Sample Used-Car Risk Report — Driveway Advocate",
  description:
    "A fake, illustrative sample of the human-delivered Used-Car Risk Report — vehicle snapshot, risk flags, history review, inspection priorities, scripts, and document checklist. Not a real customer report; not purchasable yet.",
};

const R = SAMPLE_USED_CAR_RISK_REPORT;

const SEVERITY_STYLES: Record<ReportSeverity, { wrap: string; badge: string }> = {
  high: { wrap: "border-verdict-red/25 bg-verdict-red/5", badge: "bg-verdict-red/15 text-verdict-red" },
  medium_high: { wrap: "border-verdict-red/20 bg-verdict-red/[0.04]", badge: "bg-verdict-red/10 text-verdict-red" },
  medium: { wrap: "border-verdict-amber/25 bg-verdict-amber/5", badge: "bg-verdict-amber/15 text-verdict-amber" },
  low: { wrap: "border-navy/15 bg-white", badge: "bg-navy-50 text-navy/60" },
};

export default function SampleReportPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 pb-6 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-blue-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue">
              Used-Car Risk Report · sample
            </span>
            <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Sample Used-Car Risk Report
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            {R.header.summary}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/services/used-car-risk-report"
              className="text-sm font-semibold text-blue hover:underline"
            >
              ← Back to the Used-Car Risk Report overview
            </Link>
            <Link
              href="/services/used-car-risk-report/check"
              className="text-sm font-semibold text-blue hover:underline"
            >
              Preview the used-car risk flow →
            </Link>
          </div>
        </section>

        {/* Fake-data warning */}
        <section className="mx-auto max-w-3xl px-4 pb-2">
          <div className="rounded-xl border border-blue/30 bg-blue-soft px-4 py-3">
            <p className="text-sm leading-relaxed text-navy/75">
              <span className="font-semibold text-blue">Fake sample data.</span>{" "}
              {R.header.fakeDataWarning} The full Used-Car Risk Report isn&apos;t
              purchasable yet — this page just shows what the deliverable looks
              like. The pilot preview it links to is free and collects no payment.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl space-y-8 px-4 py-10">
          {/* Vehicle snapshot */}
          <Block title="Vehicle snapshot">
            <div className="card">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <SnapRow label="Vehicle" value={R.vehicleSnapshot.vehicle} />
                <SnapRow label="Mileage" value={R.vehicleSnapshot.mileage} />
                <SnapRow label="Asking price" value={R.vehicleSnapshot.askingPrice} />
                <SnapRow label="Out-the-door price" value={R.vehicleSnapshot.outTheDoorPrice} />
                <SnapRow label="Purchase status" value={R.vehicleSnapshot.purchaseStatus} />
                <SnapRow label="Purchase state" value={R.vehicleSnapshot.purchaseState} />
                <SnapRow label="Seller type" value={R.vehicleSnapshot.sellerType} />
              </dl>
              <p className="mt-4 border-t border-navy/10 pt-3 text-sm text-navy/60">
                <span className="font-semibold text-navy/75">Documents reviewed:</span>{" "}
                {R.vehicleSnapshot.documentsReviewed}
              </p>
            </div>
          </Block>

          {/* Risk summary */}
          <Block title="Risk summary">
            <div className="overflow-hidden rounded-2xl bg-navy p-6 text-cream ring-1 ring-navy/20">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cream/55">
                Buyer-side reference point
              </p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-white">
                {REPORT_RECOMMENDATION_DISPLAY[R.riskSummary.overallRecommendation]}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Tag>Confidence: {cap(R.riskSummary.confidence)}</Tag>
                <Tag>Risk level: {cap(R.riskSummary.riskLevel)}</Tag>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-cream/80">
                <span className="font-semibold text-white">Main concern:</span>{" "}
                {R.riskSummary.mainConcern}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-cream/80">
                <span className="font-semibold text-white">Recommendation:</span>{" "}
                {R.riskSummary.buyerSideRecommendation}
              </p>
            </div>
          </Block>

          {/* Risk flag inventory */}
          <Block title="Risk flag inventory">
            <div className="space-y-4">
              {R.riskFlags.map((f) => {
                const style = SEVERITY_STYLES[f.severity];
                return (
                  <div key={f.category} className={`rounded-2xl border p-5 ${style.wrap}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words font-serif text-lg font-semibold text-navy">
                        {f.category}
                      </h3>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                        {REPORT_SEVERITY_DISPLAY[f.severity]}
                      </span>
                    </div>
                    <KeyLine label="What was found" value={f.whatWasFound} />
                    <KeyLine label="Why it matters" value={f.whyItMatters} />
                    <KeyLine label="What to verify" value={f.whatToVerify} />
                    <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-navy/75">
                      <span className="font-semibold text-navy/80">Ask:</span> {f.buyerQuestion}
                    </p>
                  </div>
                );
              })}
            </div>
          </Block>

          {/* Vehicle-history review */}
          <Block title="Vehicle-history review">
            <div className="card space-y-3">
              <KeyLine label="Title status" value={R.vehicleHistoryReview.titleStatus} />
              <KeyLine label="Accident / damage" value={R.vehicleHistoryReview.accidentDamage} />
              <KeyLine label="Use history" value={R.vehicleHistoryReview.useHistory} />
              <KeyLine label="Owner history" value={R.vehicleHistoryReview.ownerHistory} />
              <KeyLine label="Recall / CPO / warranty" value={R.vehicleHistoryReview.recallCpoWarranty} />
              <KeyLine label="Missing information" value={R.vehicleHistoryReview.missingInformation} />
            </div>
          </Block>

          {/* Pricing and deal-structure review */}
          <Block title="Pricing & deal-structure review">
            <div className="card space-y-3">
              <KeyLine label="Asking price" value={R.pricingReview.askingPriceConcern} />
              <KeyLine label="Out-the-door price" value={R.pricingReview.outTheDoorConcern} />
              <KeyLine label="Dealer fees / add-ons" value={R.pricingReview.dealerFeeAddOnConcern} />
              <KeyLine label="Too-good-to-be-true" value={R.pricingReview.tooGoodToBeTrueConcern} />
              <KeyLine label="Needs written clarification" value={R.pricingReview.needsWrittenClarification} />
            </div>
          </Block>

          {/* Inspection priorities */}
          <Block title="Inspection priorities">
            <div className="space-y-4">
              <SubCard title="Mechanical" items={R.inspectionPriorities.mechanical} />
              <SubCard title="Body / frame" items={R.inspectionPriorities.bodyFrame} />
              <SubCard title="Tire / brake / wear" items={R.inspectionPriorities.tireBrakeWear} />
              <SubCard title="Title / document verification" items={R.inspectionPriorities.titleDocument} />
              <SubCard title="Recall / CPO verification" items={R.inspectionPriorities.recallCpo} />
            </div>
          </Block>

          {/* Seller questions */}
          <Block title="Seller questions">
            <div className="space-y-4">
              <SubCard title="Before moving forward" items={R.sellerQuestions.beforeMovingForward} />
              <SubCard title="Require written answers" items={R.sellerQuestions.requireWrittenAnswers} />
            </div>
          </Block>

          {/* Walk-away / slow-down triggers */}
          <Block title="Walk-away / slow-down triggers">
            <div className="space-y-4">
              <SubCard title="Strong walk-away signals" items={R.decisionTriggers.walkAwaySignals} />
              <SubCard title="Inspect-first signals" items={R.decisionTriggers.inspectFirstSignals} />
              <SubCard title="Renegotiate-or-verify signals" items={R.decisionTriggers.renegotiateOrVerifySignals} />
              <SubCard title="Needs-documents signals" items={R.decisionTriggers.needsDocumentsSignals} />
            </div>
          </Block>

          {/* Suggested buyer scripts */}
          <Block title="Suggested buyer scripts">
            <div className="space-y-3">
              <ScriptCard title="Before signing" body={R.buyerScripts.beforeSigning} />
              <ScriptCard title="Requesting an inspection" body={R.buyerScripts.inspectionRequest} />
              <ScriptCard title="If the history report is missing" body={R.buyerScripts.missingHistory} />
              <ScriptCard title="Price / out-the-door clarification" body={R.buyerScripts.priceOtdClarification} />
              <ScriptCard title="If you've already signed" body={R.buyerScripts.alreadySigned} />
            </div>
          </Block>

          {/* Document checklist */}
          <Block title="Documents to gather">
            <div className="card">
              <ul className="space-y-2">
                {R.documentChecklist.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Block>

          {/* Disclaimers */}
          <Block title="Disclaimers">
            <div className="rounded-2xl border border-navy/10 bg-cream-100 p-5">
              <ul className="space-y-2.5">
                {R.disclaimers.map((d, i) => (
                  <li key={i} className="text-xs leading-relaxed text-navy/60">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <Disclaimer />
            </div>
          </Block>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-blue">
          {title}
        </h2>
        <span className="h-px flex-1 bg-navy/10" />
      </div>
      {children}
    </div>
  );
}

function SnapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-navy/5 pb-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-navy/50">{label}</dt>
      <dd className="text-right text-sm font-medium text-navy/80">{value}</dd>
    </div>
  );
}

function KeyLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-relaxed text-navy/75">
      <span className="font-semibold text-navy/80">{label}:</span> {value}
    </p>
  );
}

function SubCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/75">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScriptCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">{title}</p>
      <p className="mt-1.5 font-serif text-[15px] italic leading-relaxed text-navy/80">
        “{body}”
      </p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cream/90">
      {children}
    </span>
  );
}
