import { describe, it, expect } from "vitest";
import { parseTitleHistory } from "./normalize";

describe("parseTitleHistory", () => {
  it("flags a salvage brand + total-loss record as branded", () => {
    const t = parseTitleHistory({
      success: true,
      titles: [{ state: "TX", date: "2019-01-01", meter: 30000, current: true }],
      brands: [{ code: "SALVAGE", state: "TX", date: "2018-06-01" }],
      jsi: [{ type: "INSURANCE", date: "2018-05-01" }],
    });
    expect(t).not.toBeNull();
    expect(t!.branded).toBe(true);
    expect(t!.totalLoss).toBe(true);
    expect(t!.brands).toEqual([{ label: "Salvage", state: "TX", date: "2018-06-01" }]);
    expect(t!.titleRecordCount).toBe(1);
    expect(t!.lastOdometer).toBe(30000);
  });

  it("reports a clean VIN as not branded (so the UI can reassure)", () => {
    const t = parseTitleHistory({
      success: true,
      titles: [{ state: "CA", date: "2020-03-01", meter: 10000, current: true }],
      brands: [],
      jsi: [],
    });
    expect(t).not.toBeNull();
    expect(t!.branded).toBe(false);
    expect(t!.totalLoss).toBe(false);
    expect(t!.brands).toEqual([]);
    expect(t!.lastOdometer).toBe(10000);
  });

  it("detects a likely odometer rollback (later reading materially lower)", () => {
    const t = parseTitleHistory({
      success: true,
      titles: [
        { date: "2018-01-01", meter: 80000 },
        { date: "2020-01-01", meter: 40000, current: true },
      ],
    });
    expect(t!.odometerRollbackSuspected).toBe(true);
  });

  it("returns null for a missing or errored response (never fabricates)", () => {
    expect(parseTitleHistory(null)).toBeNull();
    expect(parseTitleHistory({ success: false })).toBeNull();
    expect(parseTitleHistory({ error: "not found" })).toBeNull();
  });
});
