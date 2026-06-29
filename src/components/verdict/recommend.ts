/**
 * Soft-paywall recommender (Phase B, light version).
 *
 * Pure: maps a fairness verdict + the flags that fired onto the buyer-side
 * SERVICE that best fits — a polite "go deeper / get an advocate" nudge. This is
 * NOT the free focused-check grid (that's VerdictNextSteps); it recommends paid
 * advocacy services and is deliberately NON-BLOCKING — it never gates the free
 * report. The full signal-driven engine + cross-sell tracking is Phase D
 * (docs/PRODUCT-ARCHITECTURE.md §13).
 */
import type { FairnessResult, FlagType } from "@/lib/fairness-engine";

export interface ServiceRecommendation {
  href: string;
  label: string;
  reason: string;
}

/** Fee / F&I padding the dealer added — a Deal Rescue review challenges these. */
const FEE_OR_FNI: FlagType[] = [
  "junk_fee",
  "overpriced_addon",
  "redundant_addon",
  "overpriced_warranty",
  "financed_addon",
];
/** Financing-side markup. */
const FINANCE: FlagType[] = ["apr_markup", "payment_packing"];

export function recommendServices(result: FairnessResult | null): ServiceRecommendation[] {
  const recs: ServiceRecommendation[] = [];
  const types = new Set((result?.flags ?? []).map((f) => f.type));
  const verdict = result?.overallVerdict;

  const hasFee = FEE_OR_FNI.some((t) => types.has(t));
  const hasFinance = FINANCE.some((t) => types.has(t));
  const serious = verdict === "red" || verdict === "black";

  // Lead recommendation: the service that best matches what the verdict found.
  if (serious || hasFee || hasFinance) {
    recs.push({
      href: "/quote-review",
      label: "Get a full Deal Rescue review",
      reason: serious
        ? "We flagged serious issues — a full review arms you to push back, or walk."
        : hasFee
          ? "We spotted fee or add-on padding worth challenging line-by-line."
          : "We spotted financing markup — a full review checks your rate and payment.",
    });
  } else {
    // Clean-ish deal: preparing to negotiate is the natural next step.
    recs.push({
      href: "/build-my-plan",
      label: "Build a negotiation plan",
      reason: "Lock in your target numbers and walk in with a plan before you sign.",
    });
  }

  // Always offer a human advocate — the universal upgrade, in exactly one place.
  recs.push({
    href: "/human-review",
    label: "Have an advocate review it",
    reason: "A second set of expert eyes on your exact deal.",
  });

  return recs;
}
