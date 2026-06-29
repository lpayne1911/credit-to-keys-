"use client";

/**
 * Client fallback for the Deal Review page. When Supabase isn't the source, the
 * intake form saved the result to the on-device workspace; this reads it back so
 * the page still renders on the device that submitted it.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { DealReviewView } from "@/components/deal-review/DealReviewView";
import { Disclaimer } from "@/components/Disclaimer";
import { getReportPayload } from "@/lib/workspace/store";
import type { DealReviewResult } from "@/lib/deal-engine/types";

export function DealReviewClientFallback({ dealId }: { dealId: string }) {
  const [state, setState] = useState<"loading" | "found" | "missing">("loading");
  const [result, setResult] = useState<DealReviewResult | null>(null);

  useEffect(() => {
    const parsed = getReportPayload<DealReviewResult>("quote-review", dealId);
    if (parsed?.schemaVersion === "deal-review-1") {
      setResult(parsed);
      setState("found");
      return;
    }
    setState("missing");
  }, [dealId]);

  if (state === "loading") {
    return <p className="pt-10 text-center text-sm text-navy/50">Loading your review…</p>;
  }

  if (state === "missing" || !result) {
    return (
      <div className="card text-center">
        <h1 className="font-serif text-2xl font-semibold text-navy">
          Review not found here
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-navy/60">
          This Deal Review was generated without a saved account, so it only
          lives on the device you submitted it from. Open it there, or run a new
          review.
        </p>
        <Link href="/quote-review/intake" className="btn-primary mt-5">
          Review my quote
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DealReviewView result={result} />
      <Disclaimer />
      <Link
        href="/quote-review/intake"
        className="block py-2 text-center text-sm font-semibold text-gold-dark hover:underline"
      >
        ← Review another quote
      </Link>
    </div>
  );
}
