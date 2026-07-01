import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildTitleHistory } from "./buildTitleHistory";
import {
  fetchTitleHistory,
  isConfigured,
  isEnabled,
} from "@/lib/sources/vinaudit/connector";

vi.mock("@/lib/sources/vinaudit/connector");

const mockFetch = vi.mocked(fetchTitleHistory);
const mockConfigured = vi.mocked(isConfigured);
const mockEnabled = vi.mocked(isEnabled);

const VIN = "1HGCM82633A004352";

beforeEach(() => {
  vi.resetAllMocks();
  mockConfigured.mockReturnValue(true);
  mockEnabled.mockReturnValue(true);
});

describe("buildTitleHistory", () => {
  it("returns null (and makes no paid call) when disabled", async () => {
    mockEnabled.mockReturnValue(false);
    expect(await buildTitleHistory(VIN)).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null (no call) for a missing/invalid VIN", async () => {
    expect(await buildTitleHistory(null)).toBeNull();
    expect(await buildTitleHistory("NOTAVIN")).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns a normalized report for a branded VIN when enabled + configured", async () => {
    mockFetch.mockResolvedValue({
      success: true,
      brands: [{ code: "SALVAGE" }],
      titles: [{ meter: 42000, current: true, date: "2021-01-01" }],
    });
    const report = await buildTitleHistory(VIN);
    expect(report).not.toBeNull();
    expect(report!.branded).toBe(true);
    expect(report!.source.provider).toBe("vinaudit");
  });

  it("returns null when the provider returns nothing usable", async () => {
    mockFetch.mockResolvedValue(null);
    expect(await buildTitleHistory(VIN)).toBeNull();
  });
});
