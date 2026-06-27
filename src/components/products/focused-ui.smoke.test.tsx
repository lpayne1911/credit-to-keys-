import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FocusedCheck } from "@/components/products/FocusedCheck";
import { FocusedResult } from "@/components/products/FocusedResult";
import { getProduct } from "@/lib/products/product-catalog";
import { FOCUSED_FLOWS } from "@/lib/products/focused-flows";
import { scoreDeal } from "@/lib/fairness-engine";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("FocusedCheck first screen is product-specific", () => {
  it("warranty opens with the real VehicleSelector (make dropdown, not free text)", () => {
    const m = html(createElement(FocusedCheck, { productId: "warranty-check" }));
    expect(m).toContain("What&#x27;s the vehicle?");
    expect(m).toContain("Toyota"); // make options come from the selector
    expect(m).toContain("Honda");
    expect(m).toContain("I don&#x27;t know / not sure"); // explicit make opt-out
    expect(m).toContain("Choose a make first"); // dependent model dropdown, disabled
  });

  it("APR opens by asking credit — NOT the brand picker", () => {
    const m = html(createElement(FocusedCheck, { productId: "apr-check" }));
    expect(m).toContain("Roughly where&#x27;s your credit?");
    expect(m).not.toContain("What&#x27;s the vehicle?");
    expect(m).not.toContain("What are you buying?");
  });

  it("add-on opens by asking the state — NOT the brand picker", () => {
    const m = html(createElement(FocusedCheck, { productId: "add-on-check" }));
    expect(m).toContain("What state are you buying in?");
    expect(m).not.toContain("What are you buying?");
  });

  it("every focused flow shows an escape hatch to human review", () => {
    for (const id of ["warranty-check", "apr-check", "add-on-check"]) {
      const m = html(createElement(FocusedCheck, { productId: id }));
      expect(m, id).toContain('href="/human-review"');
    }
  });
});

describe("FocusedResult is framed per product (not the generic verdict)", () => {
  function resultFor(focus: "warranty" | "apr" | "addons") {
    const sub =
      focus === "warranty"
        ? FOCUSED_FLOWS.warranty.toSubmission(
            { make: "Honda", year: 2021, mileage: 40000, coverageTier: "stated_component", termMonths: "60", priceQuoted: 6000 },
            null,
          )
        : focus === "apr"
          ? FOCUSED_FLOWS.apr.toSubmission({ creditBand: "good", vehiclePrice: 28000, apr: 18, termMonths: "72" }, null)
          : FOCUSED_FLOWS.addons.toSubmission({ __addons: "nitrogen,title", state: "CA" }, null);
    // mirror the API's mapping (toFairnessInput) minimally via scoreDeal-compatible shape
    return sub;
  }

  it("warranty result leads with warranty fairness copy", () => {
    const product = getProduct("warranty-check")!;
    const sub = resultFor("warranty");
    const result = scoreDeal({
      vehicle: { make: "Honda", year: 2021, model: "", mileage: 40000 },
      deal: { creditBand: "unknown", fees: [] },
      warranty: { coverageTier: "stated_component", termMonths: 60, priceQuoted: 6000 },
    });
    expect(sub.warranty).toBeTruthy();
    const m = html(
      createElement(FocusedResult, {
        product,
        result,
        answers: { year: 2021, make: "Honda", model: "Accord" },
      }),
    );
    expect(m).toContain("Your warranty fairness check");
    // the result echoes the vehicle it was scored against
    expect(m).toContain("2021 Honda Accord");
  });

  it("APR result leads with rate & payment copy", () => {
    const product = getProduct("apr-check")!;
    const result = scoreDeal({
      vehicle: { make: "", year: 2021, model: "" },
      deal: { vehiclePrice: 28000, apr: 18, termMonths: 72, creditBand: "good", fees: [] },
    });
    const m = html(createElement(FocusedResult, { product, result, answers: { apr: 18 } }));
    expect(m).toContain("Your rate &amp; payment check");
  });

  it("add-on result leads with add-on/fee copy", () => {
    const product = getProduct("add-on-check")!;
    const result = scoreDeal({
      vehicle: { make: "", year: 2021, model: "" },
      deal: { creditBand: "unknown", fees: [{ label: "Nitrogen tire fill", amount: 299 }] },
    });
    const m = html(createElement(FocusedResult, { product, result, answers: {} }));
    expect(m).toContain("Your add-ons &amp; fees check");
  });
});
