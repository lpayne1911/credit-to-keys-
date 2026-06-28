import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VehicleSelector } from "@/components/vehicle/VehicleSelector";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const noop = () => {};

describe("VehicleSelector", () => {
  it("shows make options and an explicit 'I don't know'", () => {
    const m = html(createElement(VehicleSelector, { value: {}, onChange: noop }));
    expect(m).toContain("Toyota");
    expect(m).toContain("Honda");
    expect(m).toContain("I don&#x27;t know");
  });

  it("disables the model dropdown until a make is chosen", () => {
    const m = html(createElement(VehicleSelector, { value: {}, onChange: noop }));
    expect(m).toContain("Choose a make first");
    expect(m).toMatch(/<select[^>]*disabled/);
  });

  it("shows the make's models once a make is selected (Toyota → Camry)", () => {
    const m = html(createElement(VehicleSelector, { value: { make: "Toyota" }, onChange: noop }));
    expect(m).toContain("Camry");
    expect(m).toContain("Model not listed");
  });

  it("falls back to manual entry when the stored model isn't in the list", () => {
    const m = html(
      createElement(VehicleSelector, { value: { make: "Toyota", model: "Zephyr" }, onChange: noop }),
    );
    // a text input (manual model) is rendered, holding the unknown model
    expect(m).toMatch(/<input[^>]*value="Zephyr"/);
  });

  it("offers a 'Make not listed' option for makes outside the catalog", () => {
    const m = html(createElement(VehicleSelector, { value: {}, onChange: noop }));
    expect(m).toContain("Make not listed");
  });

  it("falls back to manual MAKE entry when the stored make isn't in the catalog", () => {
    const m = html(
      createElement(VehicleSelector, { value: { make: "Lucid", model: "Air" }, onChange: noop }),
    );
    // make renders as a text input holding the unknown make…
    expect(m).toMatch(/<input[^>]*value="Lucid"/);
    // …and the model is manual too (no model list for a free-typed make)
    expect(m).toMatch(/<input[^>]*value="Air"/);
  });
});
