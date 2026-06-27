import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VinAutofill } from "@/components/vehicle/VinAutofill";

/**
 * Render-to-HTML smoke test. Effects don't run under renderToStaticMarkup, so
 * this just proves the optional VIN field mounts with its label and input —
 * the network decode path is exercised by integration/manual testing, not here.
 */
describe("VinAutofill renders", () => {
  it("mounts as a labeled, optional input", () => {
    const html = renderToStaticMarkup(
      createElement(VinAutofill, {
        value: "",
        onChange: () => {},
        onDecoded: () => {},
      }),
    );
    expect(html).toContain("VIN (optional)");
    expect(html).toContain("17-character VIN"); // placeholder
    // Idle hint reassures it's skippable.
    expect(html).toContain("skip it and type it in");
  });
});
