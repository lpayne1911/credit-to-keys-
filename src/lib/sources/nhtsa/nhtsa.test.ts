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
