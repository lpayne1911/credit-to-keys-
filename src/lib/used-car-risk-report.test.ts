import { describe, it, expect } from "vitest";
import {
  SAMPLE_USED_CAR_RISK_REPORT,
  REPORT_RECOMMENDATION_DISPLAY,
  type UsedCarRiskReport,
} from "./used-car-risk-report";

/**
 * Contract tests for the human-delivered Used-Car Risk Report sample. These pin
 * the structural shape, the buyer-side compliance language, and — critically —
 * that the CUSTOMER-FACING sample data never contains unsafe phrasing.
 */

function customerText(r: UsedCarRiskReport): string {
  return [
    ...Object.values(r.header),
    ...Object.values(r.vehicleSnapshot),
    r.riskSummary.mainConcern,
    r.riskSummary.buyerSideRecommendation,
    ...r.riskFlags.flatMap((f) => [
      f.category,
      f.whatWasFound,
      f.whyItMatters,
      f.whatToVerify,
      f.buyerQuestion,
    ]),
    ...Object.values(r.vehicleHistoryReview),
    ...Object.values(r.pricingReview),
    ...Object.values(r.inspectionPriorities).flat(),
    ...Object.values(r.sellerQuestions).flat(),
    ...Object.values(r.decisionTriggers).flat(),
    ...Object.values(r.buyerScripts),
    ...r.documentChecklist,
    ...r.disclaimers,
  ].join("  ");
}

describe("SAMPLE_USED_CAR_RISK_REPORT — structure", () => {
  const R = SAMPLE_USED_CAR_RISK_REPORT;

  it("includes every required section", () => {
    expect(R.header).toBeTruthy();
    expect(R.vehicleSnapshot).toBeTruthy();
    expect(R.riskSummary).toBeTruthy();
    expect(R.riskFlags.length).toBeGreaterThanOrEqual(5);
    expect(R.vehicleHistoryReview).toBeTruthy();
    expect(R.pricingReview).toBeTruthy();
    expect(R.inspectionPriorities).toBeTruthy();
    expect(R.sellerQuestions).toBeTruthy();
    expect(R.decisionTriggers).toBeTruthy();
    expect(R.buyerScripts).toBeTruthy();
    expect(R.documentChecklist.length).toBeGreaterThan(0);
    expect(R.disclaimers.length).toBeGreaterThan(0);
  });

  it("uses the expected fake sample vehicle and figures", () => {
    expect(R.vehicleSnapshot.vehicle).toMatch(/2021 Honda Accord EX-L/);
    expect(R.vehicleSnapshot.mileage).toMatch(/68,400/);
    expect(R.vehicleSnapshot.askingPrice).toBe("$20,995");
    expect(R.vehicleSnapshot.purchaseState).toBe("Virginia");
    expect(R.vehicleSnapshot.sellerType).toMatch(/independent dealer/i);
  });

  it("uses a known recommendation label in the risk summary", () => {
    expect(REPORT_RECOMMENDATION_DISPLAY[R.riskSummary.overallRecommendation]).toBeTruthy();
  });

  it("gives every risk flag a what-to-verify and a buyer question", () => {
    for (const f of R.riskFlags) {
      expect(f.whatToVerify.trim().length).toBeGreaterThan(0);
      expect(f.buyerQuestion.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("SAMPLE_USED_CAR_RISK_REPORT — framing", () => {
  const text = customerText(SAMPLE_USED_CAR_RISK_REPORT);

  it("clearly states it is fake / sample data", () => {
    expect(/sample/i.test(text)).toBe(true);
    expect(/fake|fictional|illustrative/i.test(text)).toBe(true);
  });

  it("clearly states it is not a real customer report", () => {
    expect(/not a real customer report/i.test(text)).toBe(true);
  });
});

describe("SAMPLE_USED_CAR_RISK_REPORT — disclaimers", () => {
  const d = SAMPLE_USED_CAR_RISK_REPORT.disclaimers.join("  ");

  it("includes buyer-side, no-commission, no-kickback, no-steering language", () => {
    expect(/buyer'?s side|buyer-side/i.test(d)).toBe(true);
    expect(/no commissions|receive no commissions/i.test(d)).toBe(true);
    expect(/no kickbacks/i.test(d)).toBe(true);
    expect(/steer/i.test(d)).toBe(true);
  });

  it("includes decision-support / not-advice language", () => {
    expect(/decision support/i.test(d)).toBe(true);
    expect(/not legal, financial, tax, insurance, title, mechanical, or safety advice/i.test(d)).toBe(
      true,
    );
  });

  it("disclaims selling products and receiving compensation", () => {
    expect(/we do not sell/i.test(d)).toBe(true);
    expect(/commission/i.test(d)).toBe(true);
  });
});

describe("SAMPLE_USED_CAR_RISK_REPORT — buyer scripts", () => {
  const s = SAMPLE_USED_CAR_RISK_REPORT.buyerScripts;

  it("covers before-signing, inspection, missing-history, price/OTD, and already-signed", () => {
    expect(/before i sign/i.test(s.beforeSigning)).toBe(true);
    expect(/inspection/i.test(s.inspectionRequest)).toBe(true);
    expect(/history report/i.test(s.missingHistory)).toBe(true);
    expect(/out-the-door/i.test(s.priceOtdClarification)).toBe(true);
    expect(/already signed/i.test(s.alreadySigned)).toBe(true);
  });
});

describe("SAMPLE_USED_CAR_RISK_REPORT — document checklist", () => {
  const docs = SAMPLE_USED_CAR_RISK_REPORT.documentChecklist.join("  ");

  it("includes title, history, inspection, OTD, recall, and CPO items", () => {
    expect(/title/i.test(docs)).toBe(true);
    expect(/history report/i.test(docs)).toBe(true);
    expect(/inspection/i.test(docs)).toBe(true);
    expect(/out-the-door/i.test(docs)).toBe(true);
    expect(/recall/i.test(docs)).toBe(true);
    expect(/cpo/i.test(docs)).toBe(true);
  });
});

describe("SAMPLE_USED_CAR_RISK_REPORT — no forbidden phrases", () => {
  const FORBIDDEN: RegExp[] = [
    /\bunsafe\b/i,
    /illegal/i,
    /\bfraud/i,
    /guaranteed/i,
    /exact value/i,
    /exact fair price/i,
    /\bdefinitely\b/i,
    /stop paying/i,
    /\bunwind\b/i,
    /will fail/i,
    /official report/i,
    /final report/i,
    /legal finding/i,
  ];

  it("contains none of the forbidden phrases", () => {
    const text = customerText(SAMPLE_USED_CAR_RISK_REPORT);
    for (const re of FORBIDDEN) {
      expect(re.test(text), `should not match ${re}`).toBe(false);
    }
  });
});
