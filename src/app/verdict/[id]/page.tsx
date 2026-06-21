import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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
    <>
      <SiteHeader />
      <main className="mx-auto max-w-prose px-4 py-8 sm:py-12">
        {!deal ? (
          <NotFound />
        ) : (
          <>
            <div className="mb-6">
              <Link
                href="/check"
                className="text-sm font-medium text-gold-dark hover:underline"
              >
                ← Check another deal
              </Link>
              <h1 className="mt-2 font-serif text-3xl font-semibold text-navy">
                {[deal.vehicle_year, deal.vehicle_make, deal.vehicle_model]
                  .filter(Boolean)
                  .join(" ") || "Your deal"}
              </h1>
              <p className="mt-1 text-sm text-navy/55">
                Here&apos;s our read on the offer you entered.
              </p>
            </div>

            {/* Disclaimer appears on every verdict (compliance). */}
            <div className="mb-6">
              <Disclaimer />
            </div>

            {/* Prefer a published human-reviewed verdict; else the auto verdict. */}
            {deal.reviewed_verdict ? (
              <VerdictView
                result={buildReviewedResult(deal)}
                reviewedNote={
                  deal.reviewed_headline ??
                  "An advocate reviewed and adjusted this verdict."
                }
              />
            ) : deal.auto_result ? (
              <VerdictView result={deal.auto_result as FairnessResult} />
            ) : (
              <p className="text-navy/60">
                We couldn&apos;t load the verdict for this deal.
              </p>
            )}

            <div className="mt-8">
              <RequestReviewButton
                dealId={deal.id}
                alreadyRequested={
                  deal.status === "review_requested" ||
                  deal.status === "in_review" ||
                  deal.status === "reviewed"
                }
              />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
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
