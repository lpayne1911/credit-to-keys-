import { describe, it, expect } from "vitest";
import {
  billingStateForCase,
  billingSummary,
  billingIsEmpty,
} from "./derive";
import type { CaseRow, CaseStatus, EngagementRow, EngagementService } from "@/lib/types";

function caseRow(status: CaseStatus, type: EngagementService = "quote_review"): CaseRow {
  return {
    id: `c-${status}`,
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

function engagement(service: EngagementService, status: "active" | "closed" = "active"): EngagementRow {
  return {
    id: `e-${service}`,
    user_id: "u1",
    service,
    status,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("billingStateForCase", () => {
  it("treats a free scan as never charged", () => {
    expect(billingStateForCase("scanned")).toBe("free");
  });

  it("only marks payment due AFTER delivery", () => {
    expect(billingStateForCase("in_review")).toBe("in_progress");
    expect(billingStateForCase("ready_for_delivery")).toBe("in_progress");
    expect(billingStateForCase("delivered")).toBe("payment_due");
    expect(billingStateForCase("payment_pending")).toBe("payment_due");
  });

  it("maps long-running cases to recurring", () => {
    expect(billingStateForCase("active")).toBe("active_recurring");
  });

  it("maps closed/cancelled to history states", () => {
    expect(billingStateForCase("closed")).toBe("completed");
    expect(billingStateForCase("cancelled")).toBe("cancelled");
  });
});

describe("billingSummary", () => {
  it("buckets cases and recurring engagements", () => {
    const s = billingSummary(
      [engagement("credit_to_keys"), engagement("deal_check")],
      [
        caseRow("delivered"),
        caseRow("in_review"),
        caseRow("closed"),
        caseRow("cancelled"),
        caseRow("scanned"),
      ],
    );
    expect(s.paymentDue.map((c) => c.status)).toEqual(["delivered"]);
    expect(s.inProgress.map((c) => c.status)).toEqual(["in_review"]);
    expect(s.history.map((c) => c.status)).toEqual(["closed", "cancelled"]);
    // Only the recurring, active engagement appears.
    expect(s.activeRecurring.map((e) => e.service)).toEqual(["credit_to_keys"]);
  });

  it("excludes closed recurring engagements", () => {
    const s = billingSummary([engagement("credit_to_keys", "closed")], []);
    expect(s.activeRecurring).toHaveLength(0);
  });

  it("reports empty when there's nothing billable", () => {
    const s = billingSummary([], [caseRow("scanned")]);
    expect(billingIsEmpty(s)).toBe(true);
  });

  it("is not empty when something is due", () => {
    const s = billingSummary([], [caseRow("payment_pending")]);
    expect(billingIsEmpty(s)).toBe(false);
    expect(s.paymentDue).toHaveLength(1);
  });
});
