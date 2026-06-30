import { describe, expect, it } from "vitest";
import type { PriceRange } from "@/lib/fairness-engine";
import { buildDealReview } from "./buildDealReview";
import { normalizeDealInput } from "./normalizeDealInput";
// Single source of truth for banned phrases + the string collector.
import { BANNED_PHRASES as BANNED, collectStrings } from "@/lib/output-contract/copy/voice";

const MARKET: PriceRange = {
  low: 24000,
  high: 26000,
  confidence: "high",
  basis: "MarketCheck active listings for 2021 Toyota Camry (42 comparables).",
};

function richDeal() {
  return normalizeDealInput({
    vehicle: { year: "2021", make: "Toyota", model: "Camry" },
    pricing: { vehiclePrice: "30000", downPayment: "2000" },
    fees: [
      { label: "Doc Fee", amount: "500" },
      { label: "Nitrogen", amount: "199" },
      { label: "Title & Registration", amount: "350" },
    ],
    addOns: [
      { label: "Extended Warranty", amount: "2800", financed: true },
      { label: "GAP", amount: "900" },
    ],
    finance: { apr: "6", termMonths: "60", amountFinanced: "30000", monthlyPayment: "700" },
    trade: { offer: "8000", estimatedValue: "11000", loanPayoff: "9000" },
    buyerState: "CA",
  });
}

describe("buildDealReview", () => {
  it("produces a full result from a problematic deal", () => {
    const r = buildDealReview(richDeal(), { marketValue: MARKET, now: "2026-06-29T00:00:00.000Z" });

    expect(r.schemaVersion).toBe("deal-review-1");
    expect(r.marketValue).toEqual(MARKET);
    expect(r.vehicleLabel).toBe("2021 Toyota Camry");

    const ids = r.riskFlags.map((f) => f.id);
    expect(ids).toContain("price_above_market");
    expect(ids).toContain("apr_payment_mismatch");
    expect(ids.some((i) => i.startsWith("dealer_fee_"))).toBe(true);
    expect(ids).toContain("warranty_markup");

    expect(r.dealScore).toBeGreaterThanOrEqual(8);
    expect(r.dealScore).toBeLessThan(100);
    expect(r.script.points.length).toBeGreaterThan(0);
    expect(r.script.points[0].heading).toBe("Selling price");
    expect(r.takeaways.length).toBeGreaterThan(0);
  });

  it("lowers confidence and skips the price flag when no market band exists", () => {
    const r = buildDealReview(richDeal(), { marketValue: null });
    expect(r.marketValue).toBeNull();
    expect(r.riskFlags.find((f) => f.id === "price_above_market")).toBeUndefined();
    expect(r.confidence).not.toBe("high");
    expect(r.confidenceReasons.join(" ")).toMatch(/no local market band/i);
  });

  it("uses the mandated payment-mismatch sentence", () => {
    const r = buildDealReview(richDeal(), { marketValue: MARKET });
    const flag = r.riskFlags.find((f) => f.id === "apr_payment_mismatch");
    expect(flag?.detail).toContain(
      "The payment does not reconcile with the APR, term, and amount financed provided.",
    );
  });
});

/* --------------------------------------------------------------------------
 *  Compliance — no unsafe legal / guarantee language anywhere in the output.
 * ------------------------------------------------------------------------ */
describe("compliance copy", () => {
  it("never emits banned legal / guarantee phrases", () => {
    const variants = [
      buildDealReview(richDeal(), { marketValue: MARKET }),
      buildDealReview(richDeal(), { marketValue: null }),
      buildDealReview(normalizeDealInput({ vehicle: { make: "Honda" } }), { marketValue: null }),
    ];
    const strings: string[] = [];
    variants.forEach((v) => collectStrings(v, strings));
    const haystack = strings.join("\n").toLowerCase();
    for (const phrase of BANNED) {
      expect(haystack, `should not contain "${phrase}"`).not.toContain(phrase);
    }
  });
});
