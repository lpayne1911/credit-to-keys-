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
    <div className="flex min-h-[100dvh] flex-col bg-cream">
      <VerdictTopBar />
      <main className="flex-1 overflow-y-auto px-5 pb-12">
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
                />
              ) : deal.auto_result ? (
                <VerdictView
                  result={deal.auto_result as FairnessResult}
                  vehicle={vehicleOf(deal)}
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

/** Minimal app-style top bar — keeps flow → reward seamless (no site chrome). */
function VerdictTopBar() {
  return (
    <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur">
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
      <div className="h-1 w-full bg-gold" />
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
