/**
 * The public sample report — a realistic, intentionally non-sensational deal
 * rendered through the REAL verdict system (VerdictView + the negotiation
 * engine), so /sample shows exactly what a buyer receives, not a marketing
 * mockup.
 *
 * Design notes:
 *  - Numbers are fictional but plausible for a 2021 Camry deal.
 *  - The Deal Score is computed by the real `dealScore()` from these flags
 *    (lands ~63 → an amber "negotiate / push back first" verdict).
 *  - The "Potential savings" headline is DERIVED by `savingsRange()` from the
 *    flag impacts below; with these numbers it sums to exactly $1,400–$2,900.
 *    Negative equity is deliberately excluded from that total (it's debt to
 *    restructure, not money to claw back), which is why it carries an impact
 *    note used by the script but isn't counted as savings.
 *  - Copy is sharp and dealership-specific, never overstating fraud or promising
 *    a guaranteed outcome.
 */
import type { FairnessResult } from "@/lib/fairness-engine";
import type { LoanInputs } from "@/components/VerdictView";
import { classifyDocFeeAmount } from "@/lib/intelligence/docFeeRules";

/**
 * Sample doc-fee finding: a Maryland buyer charged an $899 dealer processing fee
 * against MD's verified $800 cap → an "above verified cap" demonstration, shown
 * on the dealer-fee flag so /sample exercises the real doc-fee intelligence.
 */
const SAMPLE_DOC_FEE = classifyDocFeeAmount({
  stateCode: "MD",
  feeName: "Dealer processing fee",
  amountCents: 89_900,
});

export const SAMPLE_VEHICLE = {
  year: 2021,
  make: "Toyota",
  model: "Camry",
};

/** The APR the dealer "quoted" — passed through so the script names the rate. */
export const SAMPLE_LOAN: LoanInputs = {
  vehiclePrice: 27_450,
  downPayment: 2_000,
  apr: 8.9,
  termMonths: 72,
  fees: [{ amount: 1_200 }],
  warrantyPrice: 2_895,
};

export const SAMPLE_RESULT: FairnessResult = {
  overallVerdict: "amber",
  headline: "A few numbers here don't add up — push back before you sign.",
  confidence: "medium",
  confidenceReasons: [
    "We had the price, APR, term, dealer fees, trade-in, and warranty from the worksheet.",
    "A few figures — your exact trade payoff and the lender's true buy rate — are estimates until you confirm them in writing.",
  ],
  warranty: {
    rating: "negotiable",
    quotedPrice: 2_895,
    fairRange: {
      low: 1_100,
      high: 1_800,
      confidence: "medium",
      basis: "Typical third-party service-contract pricing for this make, age, and mileage.",
    },
    explanation:
      "This service contract may still be worth having, but the quoted price looks above the typical range for this coverage. The price should be challenged before signing — comparable coverage is usually available elsewhere.",
  },
  flags: [
    {
      type: "junk_fee",
      severity: "medium",
      title: "Dealer fee padding",
      explanation:
        "These look like dealer-controlled padding, not required government charges. They're often pre-printed on the worksheet so they read as mandatory — they're not. Ask to have them removed, or matched with an equal cut to the selling price.",
      estimatedImpact: {
        low: 500,
        high: 1_000,
        confidence: "high",
        basis: "Typical removable dealer add-on padding on a worksheet like this.",
      },
      // State-aware doc-fee intelligence: MD verified $800 cap, fee at $899.
      docFee: SAMPLE_DOC_FEE,
    },
    {
      type: "apr_markup",
      severity: "medium",
      title: "APR / payment mismatch",
      explanation:
        "The quoted rate is higher than a buyer with this credit profile usually qualifies for, and the monthly payment should be re-checked because the APR, term, or financed amount may not match the quoted payment. Ask for the lender's buy rate and the amount financed in writing.",
      estimatedImpact: {
        low: 250,
        high: 550,
        confidence: "medium",
        basis: "Estimated extra interest versus a typical buy rate over the loan term.",
      },
    },
    {
      type: "overpriced_warranty",
      severity: "low",
      title: "Warranty markup risk",
      explanation:
        "This warranty may still be useful, but the price looks above the typical range for this coverage, age, and mileage. The price should be challenged before signing — you can usually buy comparable coverage elsewhere.",
      estimatedImpact: {
        low: 450,
        high: 900,
        confidence: "medium",
        basis: "Gap between the quoted price and a typical fair range for this coverage.",
      },
    },
    {
      type: "negative_equity",
      severity: "low",
      title: "Trade-in equity concern",
      explanation:
        "The offer on your trade looks light, and if you still owe on it, that gap (negative equity) can quietly get rolled into the new loan. Ask the dealer to separate the trade value from the payoff so it isn't hidden inside the monthly payment.",
      estimatedImpact: {
        low: 1_500,
        high: 2_400,
        confidence: "low",
        basis: "Possible payoff-versus-offer gap; confirm your exact payoff with your lender.",
      },
    },
    {
      type: "overpriced_addon",
      severity: "low",
      title: "Add-on bundle: GAP & tire/wheel",
      explanation:
        "GAP and tire/wheel coverage are optional products, not part of the car's price, and they're often bundled in at a markup. Ask the dealer to separate required taxes and government fees from optional dealer products, and drop anything you don't want.",
      estimatedImpact: {
        low: 200,
        high: 450,
        confidence: "medium",
        basis: "Typical markup on bundled F&I add-ons.",
      },
    },
  ],
  // Market range for the vehicle price (here the asking price sits in range, so
  // it surfaces a reassuring "within market" card rather than a flag).
  marketValue: {
    low: 26_900,
    high: 28_200,
    confidence: "medium",
    basis: "MarketCheck active listings for a 2021 Toyota Camry (28 comparables).",
  },
  assumptions: [
    "Fair-price ranges are estimates for a 2021 Camry in average condition for your area — not an exact quote.",
    "The rate comparison assumes a typical 'good' credit tier; your real buy rate depends on the lender's approval.",
    "Taxes, title, and registration are treated as legitimate government charges and are never counted as savings.",
  ],
  engineVersion: "sample-1",
};
