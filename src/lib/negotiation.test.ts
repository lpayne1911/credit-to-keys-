import { describe, it, expect } from "vitest";
import { buildNegotiationScript } from "./negotiation";
import { scoreDeal, type FairnessInput } from "./fairness-engine";

/**
 * The script is a pure rephrasing of the verdict's flags, so these tests pin
 * the contract: every real issue becomes a talking point, info notes are
 * ignored, a clean deal still gets a usable script, and the copy text always
 * carries the opener and the (power-preserving) closer.
 */

function baseInput(overrides: Partial<FairnessInput> = {}): FairnessInput {
  return {
    vehicle: { year: 2021, make: "Toyota", model: "Camry", mileage: 30_000 },
    deal: {
      vehiclePrice: 26_000,
      downPayment: 2_000,
      apr: 7,
      termMonths: 60,
      creditBand: "good",
      fees: [{ label: "Title / registration", amount: 300 }],
    },
    warranty: null,
    ...overrides,
  };
}

describe("buildNegotiationScript", () => {
  it("makes one talking point per real flag and ignores info notes", () => {
    const result = scoreDeal(
      baseInput({
        deal: {
          vehiclePrice: 26_000,
          apr: 18,
          termMonths: 72,
          creditBand: "good",
          fees: [{ label: "Nitrogen tires", amount: 399 }],
        },
      }),
    );
    const realCount = result.flags.filter(
      (f) => f.type !== "missing_info" && f.type !== "info",
    ).length;
    const script = buildNegotiationScript(result);
    expect(script.points).toHaveLength(realCount);
    expect(realCount).toBeGreaterThan(0);
  });

  it("references the specific fee and a dollar figure for a junk fee", () => {
    const result = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Nitrogen tires", amount: 399 }] },
      }),
    );
    const script = buildNegotiationScript(result);
    const nitro = script.points.find((p) => /nitrogen/i.test(p.say));
    expect(nitro).toBeTruthy();
    expect(nitro!.say).toMatch(/\$/); // carries an impact figure
  });

  it("names a fee-over-ceiling cleanly, without the 'looks high' suffix", () => {
    const result = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Documentation fee", amount: 900 }] },
      }),
    );
    const script = buildNegotiationScript(result);
    const docPoint = script.points.find((p) => /documentation/i.test(p.say));
    expect(docPoint).toBeTruthy();
    expect(docPoint!.say).not.toMatch(/looks high/i);
    expect(docPoint!.heading).toBe("Documentation fee");
  });

  it("gives a clean deal a single confirm-the-price point", () => {
    const script = buildNegotiationScript(scoreDeal(baseInput()));
    expect(script.points).toHaveLength(1);
    expect(script.points[0].say).toMatch(/out-the-door/i);
  });

  it("tunes the opener to a red verdict and always preserves the walk", () => {
    const red = scoreDeal(
      baseInput({
        deal: {
          vehiclePrice: 26_000,
          apr: 18,
          termMonths: 72,
          creditBand: "good",
          fees: [
            { label: "Nitrogen tires", amount: 399 },
            { label: "Paint protection", amount: 1295 },
          ],
        },
      }),
    );
    expect(red.overallVerdict).toBe("red");
    const script = buildNegotiationScript(red);
    expect(script.opener).toMatch(/before i sign/i);
    expect(script.closer).toMatch(/walk/i);
  });

  it("produces copy text that includes the opener, points, and closer", () => {
    const script = buildNegotiationScript(
      scoreDeal(
        baseInput({
          deal: { apr: 7, creditBand: "good", fees: [{ label: "VIN etching", amount: 350 }] },
        }),
      ),
    );
    expect(script.asText).toContain(script.opener);
    expect(script.asText).toContain(script.closer);
    expect(script.asText).toMatch(/1\./);
  });

  it("is deterministic", () => {
    const r = scoreDeal(baseInput({ deal: { apr: 16.9, creditBand: "good", fees: [] } }));
    expect(buildNegotiationScript(r)).toEqual(buildNegotiationScript(r));
  });
});
