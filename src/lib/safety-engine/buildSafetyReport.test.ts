import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildSafetyReport } from "./buildSafetyReport";
import {
  fetchRecalls,
  fetchSafetyVariants,
  fetchRatingDetail,
} from "@/lib/sources/nhtsa/connector";

vi.mock("@/lib/sources/nhtsa/connector");

const mockRecalls = vi.mocked(fetchRecalls);
const mockVariants = vi.mocked(fetchSafetyVariants);
const mockDetail = vi.mocked(fetchRatingDetail);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("buildSafetyReport", () => {
  it("returns null without a full year/make/model (no wasted calls)", async () => {
    expect(await buildSafetyReport(null, "Toyota", "Camry")).toBeNull();
    expect(await buildSafetyReport(2021, null, "Camry")).toBeNull();
    expect(mockRecalls).not.toHaveBeenCalled();
  });

  it("assembles recalls + ratings when both are present", async () => {
    mockRecalls.mockResolvedValue({
      Count: 1,
      results: [{ NHTSACampaignNumber: "23V456000", Component: "BRAKES", Summary: "x" }],
    });
    mockVariants.mockResolvedValue([{ VehicleId: 999, VehicleDescription: "2021 Toyota Camry" }]);
    mockDetail.mockResolvedValue({ OverallRating: "5" });

    const report = await buildSafetyReport(2021, "Toyota", "Camry");
    expect(report).not.toBeNull();
    expect(report!.recalls).toHaveLength(1);
    expect(report!.ratings?.overall).toBe(5);
    expect(report!.source.provider).toBe("nhtsa");
  });

  it("returns null when there are no recalls AND no ratings (real-or-hidden, no mock)", async () => {
    mockRecalls.mockResolvedValue({ Count: 0, results: [] });
    mockVariants.mockResolvedValue([]);

    expect(await buildSafetyReport(2021, "Toyota", "Camry")).toBeNull();
    expect(mockDetail).not.toHaveBeenCalled();
  });

  it("still returns a report when only recalls exist (ratings null)", async () => {
    mockRecalls.mockResolvedValue({
      Count: 1,
      results: [{ NHTSACampaignNumber: "23V456000", Component: "BRAKES", Summary: "x" }],
    });
    mockVariants.mockResolvedValue(null);

    const report = await buildSafetyReport(2021, "Toyota", "Camry");
    expect(report!.recalls).toHaveLength(1);
    expect(report!.ratings).toBeNull();
  });
});
