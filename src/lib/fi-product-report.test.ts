import { describe, it, expect } from "vitest";
import {
  SAMPLE_FI_REPORT,
  REPORT_PRODUCT_LABEL_DISPLAY,
  type FiProductReport,
} from "./fi-product-report";

/**
 * Contract tests for the human-delivered F&I Product Review sample. These pin
 * the structural shape, the buyer-side compliance language, and — critically —
 * that the CUSTOMER-FACING sample data never contains unsafe phrasing.
 */

/** Every customer-facing string in the sample report, flattened. */
function customerText(report: FiProductReport): string {
  return [
    report.header.title,
    report.header.kind,
    report.header.preparedFor,
    report.header.reference,
    report.header.preparedOn,
    report.header.summary,
    ...Object.values(report.dealSnapshot),
    ...report.productInventory.flatMap((p) => Object.values(p)),
    ...report.productAnalysis.flatMap((a) => [
      a.name,
      a.referenceRead,
      ...a.observations,
      ...a.questionsToResolve,
    ]),
    ...report.challengeList.flatMap((c) => [c.product, c.issue, c.ask]),
    ...report.cancelOrKeepPlan.flatMap((c) => [c.product, c.stance, c.rationale]),
    ...Object.values(report.buyerScripts),
    ...report.documentChecklist,
    ...report.disclaimers,
  ].join("  ");
}

describe("SAMPLE_FI_REPORT — structure", () => {
  it("includes every required section", () => {
    expect(SAMPLE_FI_REPORT.header).toBeTruthy();
    expect(SAMPLE_FI_REPORT.dealSnapshot).toBeTruthy();
    expect(SAMPLE_FI_REPORT.productInventory.length).toBeGreaterThanOrEqual(3);
    expect(SAMPLE_FI_REPORT.productAnalysis.length).toBeGreaterThanOrEqual(3);
    expect(SAMPLE_FI_REPORT.challengeList.length).toBeGreaterThan(0);
    expect(SAMPLE_FI_REPORT.cancelOrKeepPlan.length).toBeGreaterThan(0);
    expect(SAMPLE_FI_REPORT.buyerScripts).toBeTruthy();
    expect(SAMPLE_FI_REPORT.documentChecklist.length).toBeGreaterThan(0);
    expect(SAMPLE_FI_REPORT.disclaimers.length).toBeGreaterThan(0);
  });

  it("uses the expected fake sample vehicle and price", () => {
    expect(SAMPLE_FI_REPORT.dealSnapshot.vehicle).toMatch(/2022 Toyota Camry SE/);
    expect(SAMPLE_FI_REPORT.dealSnapshot.vehiclePrice).toBe("$24,850");
    expect(SAMPLE_FI_REPORT.dealSnapshot.purchaseState).toBe("Maryland");
  });

  it("labels every analyzed product with a known recommendation label", () => {
    for (const a of SAMPLE_FI_REPORT.productAnalysis) {
      expect(REPORT_PRODUCT_LABEL_DISPLAY[a.label]).toBeTruthy();
    }
  });

  it("gives every inventory product a non-empty key concern", () => {
    for (const p of SAMPLE_FI_REPORT.productInventory) {
      expect(p.keyConcern.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("SAMPLE_FI_REPORT — sample/fake framing", () => {
  it("clearly states it is a fake / illustrative sample", () => {
    const text = customerText(SAMPLE_FI_REPORT);
    expect(/sample/i.test(text)).toBe(true);
    expect(/fake|illustrative|fictional/i.test(text)).toBe(true);
    expect(/not a real customer report/i.test(text)).toBe(true);
  });
});

describe("SAMPLE_FI_REPORT — disclaimers", () => {
  const disclaimers = SAMPLE_FI_REPORT.disclaimers.join("  ");

  it("includes buyer-side, no-commission, no-kickback, no-steering language", () => {
    expect(/buyer'?s side|buyer-side/i.test(disclaimers)).toBe(true);
    expect(/no commissions/i.test(disclaimers)).toBe(true);
    expect(/no kickbacks/i.test(disclaimers)).toBe(true);
    expect(/steer/i.test(disclaimers)).toBe(true);
  });

  it("includes decision-support / not-advice language", () => {
    expect(/decision support/i.test(disclaimers)).toBe(true);
    expect(/not financial, legal, tax, or insurance advice/i.test(disclaimers)).toBe(
      true,
    );
  });
});

describe("SAMPLE_FI_REPORT — buyer scripts", () => {
  const s = SAMPLE_FI_REPORT.buyerScripts;

  it("covers before-signing and after-signing", () => {
    expect(s.beforeSigning.length).toBeGreaterThan(0);
    expect(/before i sign/i.test(s.beforeSigning)).toBe(true);
    expect(/already signed/i.test(s.afterSigning)).toBe(true);
  });

  it("covers a cancellation request with a cancellation form", () => {
    expect(/cancellation form/i.test(s.cancellationRequest)).toBe(true);
  });

  it("covers a required-claim script asking for written lender proof", () => {
    expect(/written proof from the lender/i.test(s.requiredClaim)).toBe(true);
  });
});

describe("SAMPLE_FI_REPORT — no forbidden phrases in customer-facing data", () => {
  const FORBIDDEN: RegExp[] = [
    /illegal/i,
    /\bfraud/i,
    /guaranteed/i,
    /exact fair price/i,
    /definitely cancel/i,
    /stop paying/i,
    /lender never requires/i,
  ];

  it("contains none of the forbidden phrases", () => {
    const text = customerText(SAMPLE_FI_REPORT);
    for (const re of FORBIDDEN) {
      expect(re.test(text), `should not match ${re}`).toBe(false);
    }
  });

  it("never asserts an exact fair price", () => {
    expect(/\bfair price\b/i.test(customerText(SAMPLE_FI_REPORT))).toBe(false);
  });
});
