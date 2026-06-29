import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PriceDistributionChart } from "./parts";

describe("PriceDistributionChart", () => {
  it("renders bars + median/your-price markers for a real price spread", () => {
    const html = renderToStaticMarkup(
      createElement(PriceDistributionChart, {
        prices: [25_000, 26_000, 27_000, 28_000, 29_000, 30_000],
        median: 28_000,
        price: 30_050,
      }),
    );
    expect(html).toContain("Median");
    expect(html).toContain("Your price");
    expect(html).toMatch(/height:/); // bar heights rendered
  });

  it("shows a graceful fallback when there's no usable spread", () => {
    const html = renderToStaticMarkup(
      createElement(PriceDistributionChart, { prices: [25_000], median: null, price: null }),
    );
    expect(html).toContain("Not enough comparable listings");
  });
});
