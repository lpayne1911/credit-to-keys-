import { describe, it, expect } from "vitest";
import { buildNegotiationScript } from "./negotiation";
import { scoreDeal, type FairnessInput, type FairnessResult } from "./fairness-engine";

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
  it("turns an above-market price flag into a 'Vehicle price' desk script point", () => {
    const result = scoreDeal(
      baseInput({
        deal: { vehiclePrice: 31_000, creditBand: "unknown", fees: [] },
        marketValue: { low: 28_000, high: 32_000, confidence: "high", basis: "MarketCheck comps." },
        marketMedian: 30_000,
        marketTarget: 28_800,
      }),
    );
    const script = buildNegotiationScript(result);
    const point = script.points.find((p) => p.heading === "Vehicle price");
    expect(point).toBeTruthy();
    expect(point!.say).toMatch(/comparable listings|market/i);
  });

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

  it("names a doc/processing fee cleanly, without the 'looks high' suffix", () => {
    const result = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Documentation fee", amount: 900 }] },
      }),
    );
    const script = buildNegotiationScript(result);
    const docPoint = script.points.find((p) => p.heading === "Doc / processing fee");
    expect(docPoint).toBeTruthy();
    expect(docPoint!.say).not.toMatch(/looks high/i);
  });

  it("gives a clean deal a single confirm-the-price point", () => {
    // Truly clean: no fees at all, so no government-fee itemization point either.
    const script = buildNegotiationScript(
      scoreDeal(
        baseInput({
          deal: { vehiclePrice: 26_000, apr: 7, termMonths: 60, creditBand: "good", fees: [] },
        }),
      ),
    );
    expect(script.points).toHaveLength(1);
    expect(script.points[0].say).toMatch(/out-the-door/i);
  });

  it("treats government title/registration fees as legitimate, not junk", () => {
    // Within ceiling → an INFO note (not a junk challenge), with the
    // pay-but-itemize script line.
    const ok = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Title / registration", amount: 350 }] },
      }),
    );
    const govFlag = ok.flags.find((f) => f.type === "government_fee");
    expect(govFlag).toBeTruthy();
    expect(govFlag!.severity).toBe("info");
    expect(ok.flags.some((f) => f.type === "junk_fee")).toBe(false);
    const script = buildNegotiationScript(ok);
    const govPoint = script.points.find((p) => p.heading === "Government fees");
    expect(govPoint).toBeTruthy();
    expect(govPoint!.say).toMatch(/itemized/i);
  });

  it("a no-state doc fee asks for itemization, not removal", () => {
    const r = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Documentation fee", amount: 900 }] },
      }),
    );
    const doc = buildNegotiationScript(r).points.find((p) => p.heading === "Doc / processing fee");
    expect(doc).toBeTruthy();
    expect(doc!.say).toMatch(/itemize/i);
    expect(doc!.say).not.toMatch(/take the .* charge off/i);
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

  it("frames a reviewer's 'black' walk-away as disengaging, not buying", () => {
    // Black is operator-assigned, so we build the result shape directly.
    const black: FairnessResult = {
      overallVerdict: "black",
      headline: "Walk away — this deal has a serious problem.",
      confidence: "high",
      confidenceReasons: [],
      flags: [
        {
          type: "junk_fee",
          severity: "high",
          title: "Contract terms don't match what you were told",
          explanation: "The signed figures differ from the verbal offer.",
        },
      ],
      warranty: null,
      assumptions: [],
      schemaVersion: "fairness-1",
      engineVersion: "reviewed",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const s = buildNegotiationScript(black);
    expect(s.opener).toMatch(/not comfortable moving forward/i);
    expect(s.closer).toMatch(/walk away/i);
    expect(s.asText).not.toMatch(/ready to buy today/i);
  });

  it("does not add a 'nothing looks off' point to a walk-away with no flags", () => {
    const black: FairnessResult = {
      overallVerdict: "black",
      headline: "Walk away.",
      confidence: "high",
      confidenceReasons: [],
      flags: [],
      warranty: null,
      assumptions: [],
      schemaVersion: "fairness-1",
      engineVersion: "reviewed",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const s = buildNegotiationScript(black);
    expect(s.points).toHaveLength(0);
    expect(s.opener).toMatch(/not comfortable/i);
  });

  it("names the actual quoted APR when context provides it", () => {
    const r = scoreDeal(
      baseInput({
        deal: {
          apr: 18,
          creditBand: "good",
          vehiclePrice: 26_000,
          downPayment: 2_000,
          termMonths: 60,
          fees: [],
        },
      }),
    );
    const withApr = buildNegotiationScript(r, { offeredApr: 18 });
    const line = withApr.points.find((p) => /qualify for/i.test(p.say))!;
    expect(line.say).toContain("18% APR");
    // Without context it falls back to a generic but clean line.
    const generic = buildNegotiationScript(r);
    expect(generic.points.find((p) => /qualify for/i.test(p.say))!.say).toContain(
      "This APR",
    );
  });

  it("names the warranty's quoted price and fair range", () => {
    const r = scoreDeal(
      baseInput({
        warranty: { coverageTier: "powertrain", termMonths: 36, priceQuoted: 50_000 },
      }),
    );
    const line = buildNegotiationScript(r).points.find((p) =>
      /service contract/i.test(p.say),
    )!;
    expect(line.say).toContain("$50,000");
    expect(line.say).toMatch(/fair price is closer to \$/);
  });
});

describe("buildNegotiationScript — integrity across every flag type", () => {
  // Deals chosen so that, together, they trigger every real flag type the
  // engine emits: apr_markup, overpriced_addon, junk_fee (always + over-ceiling),
  // overpriced_warranty, and payment_packing.
  const deals: FairnessInput[] = [
    baseInput({
      deal: {
        vehiclePrice: 26_000,
        downPayment: 2_000,
        apr: 18,
        termMonths: 72,
        creditBand: "good",
        fees: [
          { label: "Nitrogen tires", amount: 399 }, // overpriced_addon
          { label: "Dealer prep", amount: 499 }, // junk_fee (always)
          { label: "Market adjustment", amount: 1995 }, // junk_fee (always)
          { label: "Documentation fee", amount: 900 }, // junk_fee (over-ceiling, "looks high")
          { label: "Title / registration", amount: 800 }, // junk_fee (over-ceiling, "looks high")
        ],
      },
      warranty: { coverageTier: "exclusionary", termMonths: 72, priceQuoted: 50_000 },
    }),
    baseInput({
      deal: {
        vehiclePrice: 26_000,
        downPayment: 2_000,
        apr: 7,
        termMonths: 72,
        creditBand: "good",
        monthlyPayment: 600, // payment_packing
        fees: [{ label: "Title / registration", amount: 300 }],
      },
    }),
    baseInput({
      // trade_lowball + negative_equity
      tradeIn: { offer: 7_000, estimatedValue: 10_000, loanPayoff: 11_000 },
    }),
  ];

  const BANNED = [/looks?\s+high/i, /likely junk fee/i, /possible marked/i, /::/];

  it("covers every real flag type the engine can emit", () => {
    const seen = new Set<string>();
    for (const d of deals) {
      for (const f of scoreDeal(d).flags) {
        if (f.type !== "missing_info" && f.type !== "info") seen.add(f.type);
      }
    }
    for (const t of [
      "apr_markup",
      "overpriced_addon",
      "junk_fee",
      "overpriced_warranty",
      "payment_packing",
      "trade_lowball",
      "negative_equity",
    ]) {
      expect(seen.has(t)).toBe(true);
    }
  });

  it("never leaks a raw title fragment into any say-line or heading", () => {
    for (const d of deals) {
      const script = buildNegotiationScript(scoreDeal(d), { offeredApr: d.deal.apr });
      for (const p of script.points) {
        for (const bad of BANNED) {
          expect(p.say, `say: "${p.say}"`).not.toMatch(bad);
          expect(p.heading, `heading: "${p.heading}"`).not.toMatch(bad);
        }
        // Every line is a real, complete sentence.
        expect(p.say.length).toBeGreaterThan(15);
        expect(p.say.trim().endsWith(".")).toBe(true);
        expect(p.heading.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildNegotiationScript — doc-fee script lines (state-aware)", () => {
  const FORBIDDEN =
    /\b(illegal|fraud|scam|guaranteed|definitely|lied)\b|violates? law|broke the law|legal finding/i;
  const docScript = (state: string | undefined, amount: number, label = "Doc fee") =>
    buildNegotiationScript(
      scoreDeal(baseInput({ buyerState: state, deal: { apr: 7, creditBand: "good", fees: [{ label, amount }] } })),
    );
  const docPoints = (s: ReturnType<typeof buildNegotiationScript>) =>
    s.points.filter((p) => p.heading === "Doc / processing fee");

  it("NY $190 above-cap doc fee appears in the main script (statutory-basis ask)", () => {
    const s = docScript("NY", 190);
    const pts = docPoints(s);
    expect(pts).toHaveLength(1);
    expect(pts[0].say).toMatch(/statutory basis|corrected buyer/i);
  });

  it("MD above-cap doc fee appears in the main script", () => {
    const s = docScript("MD", 950, "Dealer processing fee");
    expect(docPoints(s)[0].say).toMatch(/statutory basis|corrected buyer/i);
  });

  it("missing-state doc fee adds itemization language", () => {
    const s = docScript(undefined, 150);
    const pts = docPoints(s);
    expect(pts.length).toBeGreaterThanOrEqual(1);
    expect(pts[0].say).toMatch(/itemize/i);
  });

  it("Delaware special-case script line appears", () => {
    const s = docScript("DE", 700);
    expect(docPoints(s)[0].say).toMatch(/Delaware's state document fee/i);
  });

  it("does not also produce a generic 'take the charge off' line for the doc fee", () => {
    const s = docScript("NY", 190);
    expect(docPoints(s)).toHaveLength(1); // exactly one doc point, no duplicate
    expect(s.points.some((p) => /take the .* charge off/i.test(p.say))).toBe(false);
  });

  it("doc-fee script copy stays compliance-clean across states", () => {
    for (const [state, amt] of [["NY", 190], ["MD", 950], ["DE", 700], [undefined, 150]] as const) {
      const s = docScript(state as string | undefined, amt as number);
      expect(FORBIDDEN.test(s.asText), `${state}: ${s.asText}`).toBe(false);
    }
  });
});
