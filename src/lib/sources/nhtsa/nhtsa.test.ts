import { describe, it, expect } from "vitest";
import { parseRecalls, parseRating, parseStar } from "./normalize";

describe("parseStar", () => {
  it("maps valid 1–5 strings to numbers", () => {
    expect(parseStar("5")).toBe(5);
    expect(parseStar("1")).toBe(1);
  });
  it("returns null for 'Not Rated', empty, or out-of-range", () => {
    expect(parseStar("Not Rated")).toBeNull();
    expect(parseStar("")).toBeNull();
    expect(parseStar(undefined)).toBeNull();
    expect(parseStar("0")).toBeNull();
    expect(parseStar("6")).toBeNull();
  });
});

describe("parseRecalls", () => {
  it("maps NHTSA recall rows into the clean shape", () => {
    const recalls = parseRecalls({
      Count: 1,
      results: [
        {
          NHTSACampaignNumber: "23V456000",
          Component: "ELECTRICAL SYSTEM",
          Summary: "The backup camera may fail.",
          Consequence: "Reduced rear visibility increases crash risk.",
          Remedy: "Dealers will update the software, free of charge.",
          ReportReceivedDate: "2023-07-01",
        },
      ],
    });
    expect(recalls).toHaveLength(1);
    expect(recalls[0]).toEqual({
      campaignId: "23V456000",
      component: "ELECTRICAL SYSTEM",
      summary: "The backup camera may fail.",
      consequence: "Reduced rear visibility increases crash risk.",
      remedy: "Dealers will update the software, free of charge.",
      reportDate: "2023-07-01",
    });
  });

  it("returns an empty array for no/failed results (never fabricates)", () => {
    expect(parseRecalls(null)).toEqual([]);
    expect(parseRecalls({ Count: 0, results: [] })).toEqual([]);
    expect(parseRecalls({})).toEqual([]);
  });

  it("orders recalls newest-first (DD/MM/YYYY) so the display cap keeps recent ones", () => {
    const recalls = parseRecalls({
      Count: 3,
      results: [
        { NHTSACampaignNumber: "20V314000", Component: "A", ReportReceivedDate: "28/05/2020" },
        { NHTSACampaignNumber: "26V332000", Component: "C", ReportReceivedDate: "21/05/2026" },
        { NHTSACampaignNumber: "23V158000", Component: "B", ReportReceivedDate: "09/03/2023" },
      ],
    });
    expect(recalls.map((r) => r.campaignId)).toEqual(["26V332000", "23V158000", "20V314000"]);
  });

  it("tolerates an uppercase `Results` key (casing guard)", () => {
    const recalls = parseRecalls({
      Count: 1,
      Results: [{ NHTSACampaignNumber: "24V001000", Component: "AIR BAGS" }],
    });
    expect(recalls).toHaveLength(1);
    expect(recalls[0].component).toBe("AIR BAGS");
  });
});

describe("parseRating", () => {
  it("maps NCAP detail into stars", () => {
    expect(
      parseRating({
        OverallRating: "5",
        OverallFrontCrashRating: "4",
        OverallSideCrashRating: "5",
        RolloverRating: "4",
      }),
    ).toEqual({ overall: 5, frontCrash: 4, sideCrash: 5, rollover: 4 });
  });

  it("returns null when nothing is actually rated", () => {
    expect(parseRating(null)).toBeNull();
    expect(
      parseRating({
        OverallRating: "Not Rated",
        OverallFrontCrashRating: "",
        OverallSideCrashRating: "Not Rated",
        RolloverRating: "",
      }),
    ).toBeNull();
  });
});
