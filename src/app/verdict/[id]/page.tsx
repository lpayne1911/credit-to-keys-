import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { VerdictView } from "@/components/VerdictView";
import { RequestReviewButton } from "@/components/RequestReviewButton";
import { getDealById } from "@/lib/deals";
import type { FairnessResult } from "@/lib/fairness-engine";

export const metadata = {
  title: "Your verdict — Driveway Advocate",
};

export default async function VerdictPage({
  params,
}: {
  params: { id: string };
}) {
  const deal = await getDealById(params.id);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-cream">
      {/* layered background to match the landing aesthetic */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="orb -left-24 top-10 h-72 w-72 bg-gold/15" />
        <div className="orb right-[-6rem] top-1/3 h-80 w-80 bg-paleblue/60" />
      </div>
      <VerdictTopBar />
      <main className="relative flex-1 overflow-y-auto px-5 pb-12">
        <div className="mx-auto w-full max-w-md pt-6">
          {!deal ? (
            <NotFound />
          ) : (
            <div className="space-y-6">
              {deal.reviewed_verdict ? (
                <VerdictView
                  result={buildReviewedResult(deal)}
                  reviewedNote={
                    deal.reviewed_headline ??
                    "An advocate reviewed and adjusted this verdict."
                  }
                  vehicle={vehicleOf(deal)}
                  loan={loanOf(deal)}
                />
              ) : deal.auto_result ? (
                <VerdictView
                  result={deal.auto_result as FairnessResult}
                  vehicle={vehicleOf(deal)}
                  loan={loanOf(deal)}
                />
              ) : (
                <p className="text-navy/60">
                  We couldn&apos;t load the verdict for this deal.
                </p>
              )}

              <RequestReviewButton
                dealId={deal.id}
                alreadyRequested={
                  deal.status === "review_requested" ||
                  deal.status === "in_review" ||
                  deal.status === "reviewed"
                }
              />

              <VerdictNextSteps
                result={(deal.reviewed_verdict ? buildReviewedResult(deal) : (deal.auto_result as FairnessResult | null)) ?? null}
              />

              {/* Compact compliance line — required on every verdict. */}
              <Disclaimer />

              <Link
                href="/check"
                className="block py-2 text-center text-sm font-semibold text-gold-dark hover:underline"
              >
                ← Check another deal
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/** Route the buyer by need, driven by which flags actually fired (req 8/20). */
function VerdictNextSteps({ result }: { result: FairnessResult | null }) {
  const types = new Set((result?.flags ?? []).map((f) => f.type));
  const items: { href: string; label: string }[] = [
    { href: "/human-review", label: "Get human review" }, // always available
  ];
  if (types.has("overpriced_warranty") || result?.warranty)
    items.push({ href: "/warranty-check", label: "Review warranty details" });
  if (types.has("apr_markup") || types.has("payment_packing"))
    items.push({ href: "/apr-check", label: "Check APR / payment" });
  if (types.has("junk_fee") || types.has("overpriced_addon") || types.has("government_fee"))
    items.push({ href: "/add-on-check", label: "Review add-ons & fees" });
  items.push({ href: "/deal-rescue", label: "I already signed" });
  return (
    <div className="glass p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate">
        What next?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className="rounded-xl border border-navy/15 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
          >
            {i.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Minimal app-style top bar — keeps flow → reward seamless (no site chrome). */
function VerdictTopBar() {
  return (
    <header className="sticky top-0 z-10 bg-cream/70 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/55">
      <div className="flex h-14 items-center justify-between px-3">
        <Link
          href="/check"
          aria-label="Check another deal"
          className="flex h-9 w-9 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="font-serif text-sm font-semibold tracking-tight text-navy/80">
          Your verdict
        </span>
        <Link
          href="/"
          aria-label="Home"
          className="flex h-9 w-9 items-center justify-center rounded-full text-navy/50 hover:bg-navy/5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-gold via-gold-light to-gold" />
    </header>
  );
}

function vehicleOf(deal: {
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
}) {
  return {
    year: deal.vehicle_year,
    make: deal.vehicle_make,
    model: deal.vehicle_model,
  };
}

function loanOf(deal: {
  vehicle_price: number | null;
  down_payment: number | null;
  apr: number | null;
  term_months: number | null;
  fees: { label: string; amount: number }[] | null;
  warranty_price: number | null;
}) {
  return {
    vehiclePrice: deal.vehicle_price,
    downPayment: deal.down_payment,
    apr: deal.apr,
    termMonths: deal.term_months,
    fees: deal.fees,
    warrantyPrice: deal.warranty_price,
  };
}

/**
 * When an operator has published a reviewed verdict, present it using the same
 * VerdictView by folding the reviewed fields back into a FairnessResult shape.
 * The auto result's warranty/assumptions are preserved for context.
 */
function buildReviewedResult(deal: {
  reviewed_verdict: string | null;
  reviewed_headline: string | null;
  reviewed_flags: unknown;
  auto_result: unknown;
}): FairnessResult {
  const auto = (deal.auto_result as FairnessResult) ?? null;
  return {
    overallVerdict: (deal.reviewed_verdict as FairnessResult["overallVerdict"]) ?? "amber",
    headline: deal.reviewed_headline ?? auto?.headline ?? "Reviewed verdict",
    confidence: "high",
    confidenceReasons: auto?.confidenceReasons ?? [],
    flags: (deal.reviewed_flags as FairnessResult["flags"]) ?? auto?.flags ?? [],
    warranty: auto?.warranty ?? null,
    assumptions: auto?.assumptions ?? [],
    engineVersion: auto?.engineVersion ?? "reviewed",
  };
}

function NotFound() {
  return (
    <div className="card text-center">
      <h1 className="font-serif text-2xl font-semibold text-navy">
        Verdict not found
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-navy/60">
        This verdict link doesn&apos;t exist, has expired, or the database
        isn&apos;t configured in this environment.
      </p>
      <Link href="/check" className="btn-primary mt-5">
        Check a deal
      </Link>
    </div>
  );
}
