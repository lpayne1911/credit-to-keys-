import { describe, it, expect } from "vitest";
import { recommendationsFor, isRecurringService } from "./recommendations";
import type { CaseRow, EngagementRow, EngagementService } from "@/lib/types";

function engagement(service: EngagementService): EngagementRow {
  return {
    id: `e-${service}`,
    user_id: "u1",
    service,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function caseRow(type: EngagementService, status: CaseRow["status"]): CaseRow {
  return {
    id: `c-${type}-${status}`,
    engagement_id: "e1",
    user_id: "u1",
    type,
    status,
    stage: null,
    priority: 0,
    assigned_operator_id: null,
    due_at: null,
    sla_status: null,
    escalation_reason: null,
    intake_completeness: null,
    deal_id: "d1",
    intake_id: null,
    title: "Test",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("recommendationsFor", () => {
  it("routes a brand-new buyer by situation", () => {
    const recs = recommendationsFor([], [], 0);
    expect(recs[0].id).toBe("first-scan");
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it("upsells a quote review when there are scans but no review case", () => {
    const recs = recommendationsFor([], [], 2);
    expect(recs.some((r) => r.id === "quote-review")).toBe(true);
  });

  it("does not upsell a quote review once one exists", () => {
    const recs = recommendationsFor([], [caseRow("quote_review", "scanned")], 2);
    expect(recs.some((r) => r.id === "quote-review")).toBe(false);
  });

  it("surfaces market check and post-sale after a delivered case", () => {
    const recs = recommendationsFor([], [caseRow("quote_review", "delivered")], 1, 5);
    const ids = recs.map((r) => r.id);
    expect(ids).toContain("market-check");
    expect(ids).toContain("post-sale");
  });

  it("does not suggest post-sale when a post-sale case already exists", () => {
    const recs = recommendationsFor(
      [],
      [caseRow("quote_review", "delivered"), caseRow("deal_rescue", "submitted")],
      5,
      5,
    );
    expect(recs.some((r) => r.id === "post-sale")).toBe(false);
  });

  it("prioritizes continuing a Credit-to-Keys plan", () => {
    const recs = recommendationsFor([engagement("credit_to_keys")], [], 1);
    expect(recs.some((r) => r.id === "continue-ctk")).toBe(true);
  });

  it("never returns duplicate ids and respects the limit", () => {
    const recs = recommendationsFor([], [caseRow("deal_check", "delivered")], 3, 3);
    const ids = recs.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it("classifies recurring vs one-time services", () => {
    expect(isRecurringService("credit_to_keys")).toBe(true);
    expect(isRecurringService("concierge")).toBe(true);
    expect(isRecurringService("deal_check")).toBe(false);
    expect(isRecurringService("quote_review")).toBe(false);
  });
});
