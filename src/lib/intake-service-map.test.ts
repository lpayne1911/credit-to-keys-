import { describe, it, expect } from "vitest";
import { serviceForIntakeProduct, titleForIntake } from "./intake-service-map";

describe("serviceForIntakeProduct", () => {
  it("maps application products to their service line", () => {
    expect(serviceForIntakeProduct("concierge")).toBe("concierge");
    expect(serviceForIntakeProduct("deal-rescue")).toBe("deal_rescue");
    expect(serviceForIntakeProduct("credit-to-keys")).toBe("credit_to_keys");
  });

  it("returns null for lead-only intakes", () => {
    expect(serviceForIntakeProduct("build-my-plan")).toBeNull();
    expect(serviceForIntakeProduct("human-review")).toBeNull();
    expect(serviceForIntakeProduct("unknown")).toBeNull();
  });
});

describe("titleForIntake", () => {
  it("includes the vehicle when present", () => {
    expect(titleForIntake("credit-to-keys", { vehicle: "2022 Honda Civic" })).toBe(
      "Credit-to-Keys · 2022 Honda Civic",
    );
  });

  it("falls back to an application label without a vehicle", () => {
    expect(titleForIntake("concierge", {})).toBe("Concierge application");
    expect(titleForIntake("concierge", null)).toBe("Concierge application");
    expect(titleForIntake("deal-rescue", { vehicle: "  " })).toBe("Deal Rescue application");
  });
});
