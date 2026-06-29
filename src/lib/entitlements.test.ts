import { describe, it, expect } from "vitest";
import { entitlementsFor } from "./entitlements";
import type { CaseRow, CaseStatus, EngagementRow, EngagementService } from "./types";

function engagement(service: EngagementService): EngagementRow {
  return {
    id: "e1",
    user_id: "u1",
    service,
    status: "active",
    created_at: "",
    updated_at: "",
  };
}

function makeCase(type: EngagementService, status: CaseStatus, stage: string | null = null): CaseRow {
  return {
    id: "c1",
    engagement_id: "e1",
    user_id: "u1",
    type,
    status,
    stage,
    priority: 0,
    assigned_operator_id: null,
    due_at: null,
    sla_status: null,
    escalation_reason: null,
    intake_completeness: null,
    deal_id: "d1",
    intake_id: null,
    title: "Your deal",
    created_at: "",
    updated_at: "",
  };
}

describe("entitlementsFor", () => {
  it("a fresh customer (no engagements/cases) can scan + save, nothing else", () => {
    const e = entitlementsFor([], []);
    expect(e.can_scan).toBe(true);
    expect(e.can_save_deals).toBe(true);
    expect(e.can_view_reports).toBe(false);
    expect(e.can_download_reports).toBe(false);
    expect(e.can_message_advocate).toBe(false);
    expect(e.can_access_credit_to_keys).toBe(false);
    expect(e.can_track_ownership).toBe(false);
  });

  it("a delivered deal_check case unlocks reports", () => {
    const e = entitlementsFor([engagement("deal_check")], [makeCase("deal_check", "delivered")]);
    expect(e.can_view_reports).toBe(true);
    expect(e.can_download_reports).toBe(true);
  });

  it("a scanned (not delivered) case does NOT unlock reports", () => {
    const e = entitlementsFor([engagement("deal_check")], [makeCase("deal_check", "scanned")]);
    expect(e.can_view_reports).toBe(false);
  });

  it("an active deal_rescue case enables advocate messaging", () => {
    const e = entitlementsFor([engagement("deal_rescue")], [makeCase("deal_rescue", "in_review")]);
    expect(e.can_message_advocate).toBe(true);
  });

  it("a credit_to_keys engagement unlocks that workspace; ownership stage enables tracking", () => {
    const e = entitlementsFor(
      [engagement("credit_to_keys")],
      [makeCase("credit_to_keys", "active", "ownership")],
    );
    expect(e.can_access_credit_to_keys).toBe(true);
    expect(e.can_track_ownership).toBe(true);
  });

  it("is tier-free: takes only (engagements, cases) and returns no plan/tier flag", () => {
    // Architectural guard (§5/§26): no subscription-tier input or output.
    expect(entitlementsFor.length).toBe(2);
    const keys = Object.keys(entitlementsFor([], []));
    for (const k of keys) {
      expect(k).not.toMatch(/tier|plan|bronze|silver|gold|subscription/i);
    }
  });
});
