import { describe, it, expect } from "vitest";
import { generateRiskFlags } from "./riskFlags";
import { normalizeDealInput } from "./normalizeDealInput";
import { reconcileDealMath } from "./reconcileDealMath";
import { classifyFees } from "@/lib/fee-engine/classifyFees";
import { classifyAddOns } from "@/lib/add-on-engine/classifyAddOns";
import type { TitleHistory } from "@/lib/sources/vinaudit/types";

function flags(titleHistory: TitleHistory | null) {
  const deal = normalizeDealInput({ vehicle: { vin: "1HGCM82633A004352" } });
  return generateRiskFlags({
    deal,
    math: reconcileDealMath(deal),
    fees: classifyFees([]),
    addOns: classifyAddOns([]),
    marketValue: null,
    titleHistory,
  });
}

const branded: TitleHistory = {
  branded: true,
  brands: [{ label: "Salvage", state: "TX", date: "2018-06-01" }],
  totalLoss: true,
  theftRecord: false,
  odometerRollbackSuspected: false,
  titleRecordCount: 2,
  owners: 3,
  lastOdometer: 42000,
  source: { provider: "vinaudit", fetchedAt: "2024-01-01T00:00:00Z" },
};

describe("branded_title risk flag", () => {
  it("fires high-severity on a branded/total-loss title", () => {
    const f = flags(branded).find((x) => x.id === "branded_title");
    expect(f).toBeTruthy();
    expect(f!.severity).toBe("high");
    expect(f!.source).toBe("paperwork");
    expect(f!.detail).toMatch(/Salvage/);
    // No scriptFlagType — stays out of the pushback script, in the risk list.
    expect(f!.scriptFlagType).toBeUndefined();
  });

  it("does not fire on a clean title or when unavailable", () => {
    const clean: TitleHistory = { ...branded, branded: false, brands: [], totalLoss: false };
    expect(flags(clean).find((x) => x.id === "branded_title")).toBeUndefined();
    expect(flags(null).find((x) => x.id === "branded_title")).toBeUndefined();
  });
});
