/**
 * /deal-review/[dealId] — the Deal Review result for the Quote Review flow.
 *
 * DB-first: when Supabase is configured, the result was persisted in
 * `deals.auto_result`. We render it ONLY when it carries
 * `schemaVersion: "deal-review-1"` — guarding against the shared column also
 * used by the fairness-engine /verdict flow. When the DB isn't configured (or
 * the row isn't found), we hand off to a client fallback that reads the result
 * the intake form stashed in sessionStorage.
 */
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { DealReviewView } from "@/components/deal-review/DealReviewView";
import { getDealById } from "@/lib/deals";
import type { DealReviewResult } from "@/lib/deal-engine/types";
import { DealReviewClientFallback } from "./DealReviewClientFallback";

export const metadata = {
  title: "Your Deal Review — Driveway Advocate",
};

function isDealReview(value: unknown): value is DealReviewResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { schemaVersion?: string }).schemaVersion === "deal-review-1"
  );
}

export default async function DealReviewPage({
  params,
}: {
  params: { dealId: string };
}) {
  const deal = await getDealById(params.dealId);
  const persisted = isDealReview(deal?.auto_result)
    ? (deal!.auto_result as unknown as DealReviewResult)
    : null;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-cream">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="orb -left-24 top-10 h-72 w-72 bg-green/15" />
        <div className="orb right-[-6rem] top-1/3 h-80 w-80 bg-paleblue/60" />
      </div>
      <TopBar />
      <main className="relative flex-1 overflow-y-auto px-5 pb-12">
        <div className="mx-auto w-full max-w-xl pt-6">
          {persisted ? (
            <div className="space-y-6">
              <DealReviewView result={persisted} />
              <Disclaimer />
              <Link
                href="/quote-review/intake"
                className="block py-2 text-center text-sm font-semibold text-green-dark hover:underline"
              >
                ← Review another quote
              </Link>
            </div>
          ) : (
            <DealReviewClientFallback dealId={params.dealId} />
          )}
        </div>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-10 bg-cream/70 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/55">
      <div className="flex h-14 items-center justify-between px-3">
        <Link
          href="/quote-review/intake"
          aria-label="Review another quote"
          className="flex h-9 w-9 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="font-serif text-sm font-semibold tracking-tight text-navy/80">
          Deal Review
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
      <div className="h-1 w-full bg-gradient-to-r from-green-dark via-green to-green-dark" />
    </header>
  );
}
