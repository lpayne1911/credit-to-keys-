import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import {
  SAMPLE_FI_REPORT,
  REPORT_PRODUCT_LABEL_DISPLAY,
  type ProductConcernLevel,
} from "@/lib/fi-product-report";

export const metadata = {
  title: "Sample F&I Product Review Report — Driveway Advocate",
  description:
    "A fake, illustrative sample of the human-delivered F&I Product Review deliverable — deal snapshot, product analysis, challenge list, scripts, and document checklist. Not a real customer report; not purchasable yet.",
};

const R = SAMPLE_FI_REPORT;

const CONCERN_STYLES: Record<ProductConcernLevel, { wrap: string; badge: string }> = {
  high: {
    wrap: "border-verdict-red/25 bg-verdict-red/5",
    badge: "bg-verdict-red/15 text-verdict-red",
  },
  medium: {
    wrap: "border-verdict-amber/25 bg-verdict-amber/5",
    badge: "bg-verdict-amber/15 text-verdict-amber",
  },
  low: {
    wrap: "border-verdict-green/25 bg-verdict-green/5",
    badge: "bg-verdict-green/15 text-verdict-green",
  },
};

export default function SampleReportPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 pb-6 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-green-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green">
              F&amp;I Product Review · sample
            </span>
            <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Sample F&amp;I Product Review Report
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            {R.header.summary}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/services/fi-product-review"
              className="text-sm font-semibold text-green hover:underline"
            >
              ← Back to the F&amp;I Product Review overview
            </Link>
            <Link
              href="/services/fi-product-review/check"
              className="text-sm font-semibold text-green hover:underline"
            >
              Preview the pilot flow →
            </Link>
          </div>
        </section>

        {/* Fake-data warning */}
        <section className="mx-auto max-w-3xl px-4 pb-2">
          <div className="rounded-xl border border-green/30 bg-green-soft px-4 py-3">
            <p className="text-sm leading-relaxed text-navy/75">
              <span className="font-semibold text-green">
                Fake sample data.
              </span>{" "}
              Every name, number, and finding on this page is fictional. This is{" "}
              <strong>not a real customer report</strong> and not a completed paid
              review — the full F&amp;I Product Review isn&apos;t purchasable yet.
              It&apos;s here to show what the deliverable looks like. The pilot
              preview it links to is free, collects no payment, and doesn&apos;t
              replace the full review.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl space-y-8 px-4 py-10">
          {/* Deal snapshot */}
          <Block title="Deal snapshot">
            <div className="card">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <SnapRow label="Vehicle" value={R.dealSnapshot.vehicle} />
                <SnapRow label="Mileage" value={R.dealSnapshot.mileage} />
                <SnapRow label="Condition" value={R.dealSnapshot.condition} />
                <SnapRow label="Status" value={R.dealSnapshot.signedStatus} />
                <SnapRow label="Purchase state" value={R.dealSnapshot.purchaseState} />
                <SnapRow label="Vehicle price" value={R.dealSnapshot.vehiclePrice} />
              </dl>
              <p className="mt-4 border-t border-navy/10 pt-3 text-sm text-navy/60">
                {R.dealSnapshot.notes}
              </p>
            </div>
          </Block>

          {/* Product inventory */}
          <Block title="Product inventory">
            <div className="space-y-4">
              {R.productInventory.map((p) => (
                <div key={p.name} className="card">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="break-words font-serif text-lg font-semibold text-navy">
                      {p.name}
                    </h3>
                    <span className="font-serif text-lg font-bold text-navy">
                      {p.price}
                    </span>
                  </div>
                  <p className="text-xs text-navy/55">{p.category}</p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    <SnapRow label="Term" value={p.term} />
                    <SnapRow label="Mileage limit" value={p.mileageLimit} />
                    <SnapRow label="Deductible" value={p.deductible} />
                    <SnapRow label="In contract" value={p.inContract} />
                    <SnapRow label="Told required" value={p.toldRequired} />
                    <SnapRow label="Cancellation visible" value={p.cancellationVisible} />
                  </dl>
                  <p className="mt-3 rounded-lg bg-cream-100 px-3 py-2 text-sm text-navy/70">
                    <span className="font-semibold text-navy/80">Key concern:</span>{" "}
                    {p.keyConcern}
                  </p>
                </div>
              ))}
            </div>
          </Block>

          {/* Product-by-product analysis */}
          <Block title="Product-by-product analysis">
            <div className="space-y-4">
              {R.productAnalysis.map((a) => {
                const style = CONCERN_STYLES[a.concernLevel];
                return (
                  <div key={a.name} className={`rounded-2xl border p-5 ${style.wrap}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words font-serif text-lg font-semibold text-navy">
                        {a.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
                      >
                        {REPORT_PRODUCT_LABEL_DISPLAY[a.label]}
                      </span>
                    </div>
                    <SubList title="What the reviewer observed" items={a.observations} />
                    <SubList title="Questions to resolve" items={a.questionsToResolve} />
                    <p className="mt-4 rounded-xl border border-navy/10 bg-white p-4 text-sm leading-relaxed text-navy/75">
                      {a.referenceRead}
                    </p>
                  </div>
                );
              })}
            </div>
          </Block>

          {/* Challenge list */}
          <Block title="Challenge list">
            <div className="space-y-3">
              {R.challengeList.map((c) => (
                <div key={c.product} className="card">
                  <h3 className="font-serif text-base font-semibold text-navy">
                    {c.product}
                  </h3>
                  <p className="mt-1 text-sm text-navy/70">
                    <span className="font-semibold text-navy/80">Issue:</span> {c.issue}
                  </p>
                  <p className="mt-1.5 text-sm text-navy/70">
                    <span className="font-semibold text-navy/80">Ask:</span> {c.ask}
                  </p>
                </div>
              ))}
            </div>
          </Block>

          {/* Cancel-or-keep plan */}
          <Block title="Cancel-or-keep plan">
            <div className="space-y-3">
              {R.cancelOrKeepPlan.map((c) => (
                <div
                  key={c.product}
                  className="flex flex-col gap-1 rounded-xl border border-navy/10 bg-white p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-serif text-base font-semibold text-navy">
                      {c.product}
                    </h3>
                    <span className="rounded-full bg-navy-50 px-3 py-0.5 text-xs font-semibold text-navy/70">
                      {c.stance}
                    </span>
                  </div>
                  <p className="text-sm text-navy/70">{c.rationale}</p>
                </div>
              ))}
            </div>
          </Block>

          {/* Buyer scripts */}
          <Block title="Buyer scripts">
            <div className="space-y-3">
              <ScriptCard title="Before signing" body={R.buyerScripts.beforeSigning} />
              <ScriptCard title="After signing" body={R.buyerScripts.afterSigning} />
              <ScriptCard
                title="Requesting a cancellation"
                body={R.buyerScripts.cancellationRequest}
              />
              <ScriptCard
                title="If you're told it's required"
                body={R.buyerScripts.requiredClaim}
              />
            </div>
          </Block>

          {/* Document checklist */}
          <Block title="Documents to gather">
            <div className="card">
              <ul className="space-y-2">
                {R.documentChecklist.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-relaxed text-navy/75"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
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

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-green">
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
      <dt className="text-xs font-medium uppercase tracking-wide text-navy/50">
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-navy/80">{value}</dd>
    </div>
  );
}

function SubList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm leading-relaxed text-navy/75"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
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
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
        {title}
      </p>
      <p className="mt-1.5 font-serif text-[15px] italic leading-relaxed text-navy/80">
        “{body}”
      </p>
    </div>
  );
}
