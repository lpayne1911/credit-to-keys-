import { describe, it, expect } from "vitest";
import { SAMPLE_RESULT } from "./sample-report";
import { savingsRange } from "./verdict-summary";
import { buildNegotiationScript } from "./negotiation";
import { dealScore } from "@/components/VerdictView";

/**
 * The sample report must stay REAL: its headline savings is derived by the same
 * `savingsRange()` the product uses, its score by the same `dealScore()`, and
 * its script by the same engine. These lock the advertised numbers so a future
 * copy edit can't silently desync the page from what it claims to show.
 */
describe("public sample report", () => {
  it("derives the advertised $1,400–$2,900 savings from flag impacts (excludes negative equity)", () => {
    expect(savingsRange(SAMPLE_RESULT)).toEqual({ low: 1_400, high: 2_900 });
  });

  it("scores into the amber 'push back first' band", () => {
    expect(SAMPLE_RESULT.overallVerdict).toBe("amber");
    const score = dealScore(SAMPLE_RESULT);
    expect(score).toBeGreaterThanOrEqual(55);
    expect(score).toBeLessThanOrEqual(70);
  });

  it("surfaces verified state doc-fee intelligence on a flag (MD above cap)", () => {
    const docFlag = SAMPLE_RESULT.flags.find((f) => f.docFee);
    expect(docFlag?.docFee?.comparisonStatus).toBe("above_verified_cap");
    expect(docFlag?.docFee?.verified).toBe(true);
    expect(docFlag?.docFee?.stateCode).toBe("MD");
    expect(docFlag?.docFee?.dealerControlled).toBe(true);
    expect(docFlag?.docFee?.governmentFee).toBe(false);
  });

  it("produces a specific, multi-point pushback script naming the rate and warranty", () => {
    const script = buildNegotiationScript(SAMPLE_RESULT, { offeredApr: 8.9 });
    expect(script.points).toHaveLength(5);
    expect(script.asText).toContain("8.9%");
    expect(script.asText).toContain("service contract");
    expect(script.opener.length).toBeGreaterThan(0);
    expect(script.closer.length).toBeGreaterThan(0);
  });
});
