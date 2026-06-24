import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VerdictView } from "@/components/VerdictView";
import { scoreDeal, type FairnessInput } from "@/lib/fairness-engine";

/**
 * Render-to-HTML smoke test. This sandbox can't run a browser, but server-
 * rendering the real component tree and asserting the markup catches the wiring
 * breaks unit tests miss: the script card not mounting, a flag not reaching the
 * page, the savings hero or the collapse disappearing. Not pixels — but it
 * proves the pieces actually render together.
 */

function render(input: FairnessInput): string {
  const result = scoreDeal(input);
  return renderToStaticMarkup(
    createElement(VerdictView, {
      result,
      loan: {
        vehiclePrice: input.deal.vehiclePrice,
        downPayment: input.deal.downPayment,
        apr: input.deal.apr,
        termMonths: input.deal.termMonths,
        fees: (input.deal.fees ?? []).map((f) => ({ amount: f.amount })),
        warrantyPrice: input.warranty?.priceQuoted ?? 0,
      },
    }),
  );
}

describe("VerdictView renders", () => {
  it("a problem-heavy deal: header + script + flags-in-collapse + savings", () => {
    const html = render({
      vehicle: { year: 2019, make: "BMW", model: "3 Series", mileage: 60_000 },
      deal: {
        vehiclePrice: 28_000,
        downPayment: 1_000,
        apr: 18,
        termMonths: 72,
        creditBand: "good",
        fees: [
          { label: "Nitrogen tires", amount: 399 },
          { label: "Documentation fee", amount: 899 },
        ],
      },
      warranty: null,
      tradeIn: { offer: 6_000, estimatedValue: 9_500, loanPayoff: 10_000 },
    });

    // Verdict header + value-forward number.
    expect(html).toContain("Deal score");
    expect(html).toContain("Potential savings we spotted");

    // Primary action card with its opener (red verdict).
    expect(html).toContain("What to say at the desk");
    expect(html).toContain("Before I sign anything");

    // Each issue actually reaches the page, across types.
    expect(html).toContain("Nitrogen tire fill"); // add-on line
    expect(html).toContain("buy rate"); // apr line
    expect(html).toContain("negative equity"); // trade line

    // The detailed flags live in the disclosure, not the default view.
    expect(html).toMatch(/See all \d+ red flags/);
  });

  it("a clean deal: no-flags reassurance, no crash", () => {
    const html = render({
      vehicle: { year: 2022, make: "Toyota", model: "Camry", mileage: 20_000 },
      deal: {
        vehiclePrice: 24_000,
        downPayment: 3_000,
        apr: 6,
        termMonths: 48,
        creditBand: "excellent",
        fees: [{ label: "Title / registration", amount: 300 }],
      },
      warranty: null,
    });
    expect(html).toContain("Deal score");
    expect(html).toContain("What to say at the desk");
    expect(html).toContain("tripped a red flag");
  });
});
