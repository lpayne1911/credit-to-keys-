import { describe, it, expect } from "vitest";
import { caseStatusFromDeal, serviceForDeal } from "./cases";

describe("caseStatusFromDeal", () => {
  it("maps the legacy deal lifecycle onto the canonical case taxonomy", () => {
    expect(caseStatusFromDeal({ status: "new" })).toBe("scanned");
    expect(caseStatusFromDeal({ status: "review_requested" })).toBe("review_requested");
    expect(caseStatusFromDeal({ status: "in_review" })).toBe("in_review");
    expect(caseStatusFromDeal({ status: "reviewed" })).toBe("delivered");
    expect(caseStatusFromDeal({ status: "archived" })).toBe("closed");
  });
});

describe("serviceForDeal", () => {
  it("is quote_review for a branded Deal Review result, else deal_check", () => {
    expect(serviceForDeal({ auto_result: { schemaVersion: "deal-review-1" } as never })).toBe(
      "quote_review",
    );
    expect(serviceForDeal({ auto_result: { overallVerdict: "green" } as never })).toBe("deal_check");
    expect(serviceForDeal({ auto_result: null })).toBe("deal_check");
  });
});
