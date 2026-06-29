/**
 * ============================================================================
 *  Driveway Advocate — Used-Car Risk Report: human-delivered package model
 * ============================================================================
 *
 * Defines the SHAPE of the paid, human-delivered Used-Car Risk Report
 * deliverable and ships a single fully-worked SAMPLE built entirely from FAKE
 * data. It renders the public "sample report" page so a buyer can see what the
 * paid package looks like before it is purchasable.
 *
 * Nothing here is a real customer report, a mechanical/title/safety/legal
 * determination, or a paid service. The same compliance rules as the rest of
 * the product apply:
 *  - Buyer-side only. No commissions, no kickbacks, no steering.
 *  - No false precision. Confidence levels and ranges, never a single value.
 *  - No safety/title/legal conclusions, no accusations, never a promise of a
 *    refund/savings/cancellation/outcome, and no invented vehicle-history facts.
 *  - Decision support, not legal, financial, tax, insurance, title, mechanical,
 *    or safety advice.
 *
 * No AI, no network, no persistence — static, typed sample content.
 * ============================================================================
 */

export type ReportSeverity = "low" | "medium" | "medium_high" | "high";

export const REPORT_SEVERITY_DISPLAY: Record<ReportSeverity, string> = {
  low: "Low",
  medium: "Medium",
  medium_high: "Medium–high",
  high: "High",
};

/** Mirrors the pilot engine's overall labels. */
export type ReportRecommendation =
  | "low_concern"
  | "inspect_first"
  | "slow_down"
  | "renegotiate_or_verify"
  | "walk_away"
  | "needs_documents";

export const REPORT_RECOMMENDATION_DISPLAY: Record<ReportRecommendation, string> = {
  low_concern: "Low concern",
  inspect_first: "Inspect first",
  slow_down: "Slow down",
  renegotiate_or_verify: "Renegotiate or verify",
  walk_away: "Walk away",
  needs_documents: "Needs documents",
};

export interface ReportHeader {
  product: string;
  /** Always flags this as a fake, illustrative human-review template. */
  status: string;
  preparedFor: string;
  reference: string;
  /** A static, human-readable label — never a real timestamp. */
  preparedOn: string;
  fakeDataWarning: string;
  summary: string;
}

export interface VehicleSnapshot {
  vehicle: string;
  mileage: string;
  askingPrice: string;
  outTheDoorPrice: string;
  purchaseStatus: string;
  purchaseState: string;
  sellerType: string;
  documentsReviewed: string;
}

export interface RiskSummary {
  overallRecommendation: ReportRecommendation;
  confidence: "low" | "medium" | "high";
  riskLevel: "low" | "moderate" | "high" | "severe";
  mainConcern: string;
  buyerSideRecommendation: string;
}

export interface RiskFlagEntry {
  category: string;
  severity: ReportSeverity;
  whatWasFound: string;
  whyItMatters: string;
  whatToVerify: string;
  buyerQuestion: string;
}

export interface VehicleHistoryReview {
  titleStatus: string;
  accidentDamage: string;
  useHistory: string;
  ownerHistory: string;
  recallCpoWarranty: string;
  missingInformation: string;
}

export interface PricingReview {
  askingPriceConcern: string;
  outTheDoorConcern: string;
  dealerFeeAddOnConcern: string;
  tooGoodToBeTrueConcern: string;
  needsWrittenClarification: string;
}

export interface InspectionPriorities {
  mechanical: string[];
  bodyFrame: string[];
  tireBrakeWear: string[];
  titleDocument: string[];
  recallCpo: string[];
}

export interface SellerQuestions {
  beforeMovingForward: string[];
  requireWrittenAnswers: string[];
}

export interface DecisionTriggers {
  walkAwaySignals: string[];
  inspectFirstSignals: string[];
  renegotiateOrVerifySignals: string[];
  needsDocumentsSignals: string[];
}

export interface BuyerScripts {
  beforeSigning: string;
  inspectionRequest: string;
  missingHistory: string;
  priceOtdClarification: string;
  alreadySigned: string;
}

export interface UsedCarRiskReport {
  header: ReportHeader;
  vehicleSnapshot: VehicleSnapshot;
  riskSummary: RiskSummary;
  riskFlags: RiskFlagEntry[];
  vehicleHistoryReview: VehicleHistoryReview;
  pricingReview: PricingReview;
  inspectionPriorities: InspectionPriorities;
  sellerQuestions: SellerQuestions;
  decisionTriggers: DecisionTriggers;
  buyerScripts: BuyerScripts;
  documentChecklist: string[];
  disclaimers: string[];
}

// ---------------------------------------------------------------------------
//  SAMPLE REPORT — FAKE DATA ONLY
// ---------------------------------------------------------------------------

export const SAMPLE_USED_CAR_RISK_REPORT: UsedCarRiskReport = {
  header: {
    product: "Used-Car Risk Report",
    status: "Sample — fake data, human review template, not a real customer report",
    preparedFor: "Sample Buyer (illustrative)",
    reference: "SAMPLE-UCR-0001",
    preparedOn: "Sample report — no real date",
    fakeDataWarning:
      "Every name, number, and finding below is fictional. This is a sample of the human-delivered Used-Car Risk Report — not a real customer report, and not a completed paid review.",
    summary:
      "This sample shows how a Driveway Advocate reviewer lays out the risk on a used vehicle as a buyer-side reference point — based on the information reviewed, with independent verification flagged throughout. It is not a mechanical, title, safety, or legal determination.",
  },
  vehicleSnapshot: {
    vehicle: "2021 Honda Accord EX-L",
    mileage: "68,400 miles",
    askingPrice: "$20,995",
    outTheDoorPrice: "Not yet provided",
    purchaseStatus: "Used — buyer has not signed",
    purchaseState: "Virginia",
    sellerType: "Independent dealer",
    documentsReviewed:
      "Dealer listing only. Title document, full vehicle history report, out-the-door quote, and an independent inspection were not available for this sample.",
  },
  riskSummary: {
    overallRecommendation: "inspect_first",
    confidence: "medium",
    riskLevel: "moderate",
    mainConcern:
      "A moderate reported accident and prior rental use, combined with no independent inspection and no full out-the-door price, mean several risks need independent verification before signing.",
    buyerSideRecommendation:
      "Based on the information reviewed, this car appears worth an independent inspection and written documentation before moving forward. Slow the process down, get the missing documents, and re-check once they're in hand.",
  },
  riskFlags: [
    {
      category: "Moderate accident history",
      severity: "medium_high",
      whatWasFound:
        "Based on the information reviewed, a moderate accident appears in the vehicle's reported history.",
      whyItMatters:
        "Repair quality after a moderate accident varies, and it can affect how the vehicle drives and holds value. The history report and an inspection can show whether repairs were done well.",
      whatToVerify:
        "Needs independent verification: the full history report and an independent pre-purchase inspection focused on prior collision repair.",
      buyerQuestion:
        "What was damaged in the reported accident, and can I see the repair records and the full history report in writing?",
    },
    {
      category: "Prior rental use",
      severity: "medium",
      whatWasFound:
        "Based on the information reviewed, the vehicle appears to have prior rental use.",
      whyItMatters:
        "Rental vehicles often see harder, higher-frequency use. This is not automatically disqualifying, but it raises the need to review maintenance and wear.",
      whatToVerify:
        "Needs independent verification: the maintenance history and an inspection of wear items, and whether the price reflects the use history.",
      buyerQuestion:
        "Can you confirm how the vehicle was used and provide the maintenance and service records?",
    },
    {
      category: "Missing out-the-door price",
      severity: "medium_high",
      whatWasFound:
        "Based on the information reviewed, a full out-the-door price has not been provided.",
      whyItMatters:
        "Without an itemized out-the-door figure, taxes, fees, doc fees, and add-ons can't be separated, so the real cost of the deal isn't visible.",
      whatToVerify:
        "Ask for written documentation: the full out-the-door price, itemized, before comparing or deciding.",
      buyerQuestion:
        "Can you put the full out-the-door price in writing, with every tax, fee, and add-on itemized?",
    },
    {
      category: "No independent inspection yet",
      severity: "high",
      whatWasFound:
        "Based on the information reviewed, the buyer has not obtained an independent pre-purchase inspection.",
      whyItMatters:
        "A seller's description is not a substitute for an inspection by a mechanic the buyer chooses, especially with a reported accident and prior rental use.",
      whatToVerify:
        "Needs independent verification: a pre-purchase inspection by a mechanic the buyer selects, before signing.",
      buyerQuestion:
        "Can I take the car to my own mechanic for a pre-purchase inspection before we go further?",
    },
    {
      category: "Open recalls not checked",
      severity: "medium",
      whatWasFound:
        "Based on the information reviewed, open-recall status has not been checked for this VIN.",
      whyItMatters:
        "Open recalls should be confirmed and addressed. Checking is quick and free, and it can matter before a final decision.",
      whatToVerify:
        "Confirm recall status by VIN with the manufacturer or NHTSA, and whether any repairs are complete.",
      buyerQuestion:
        "Has this VIN been checked for open recalls, and can we confirm the status together?",
    },
    {
      category: "Title document not yet reviewed",
      severity: "medium",
      whatWasFound:
        "The listing describes a clean title, but the actual title document has not been reviewed for this sample.",
      whyItMatters:
        "A listing description isn't the same as the title document. The status should be confirmed against the document itself.",
      whatToVerify:
        "Ask for written documentation: the title document or a written title-status disclosure, and confirm it matches the listing.",
      buyerQuestion:
        "Can you show me the title document so I can confirm the current title status in writing?",
    },
  ],
  vehicleHistoryReview: {
    titleStatus:
      "Listing describes a clean title; based on the information reviewed, the title document itself has not been confirmed. Needs independent verification against the document.",
    accidentDamage:
      "A moderate accident appears in the reported history. Severity, structural involvement, and repair quality need independent verification via the full report and an inspection.",
    useHistory:
      "Appears to have prior rental use. Not automatically disqualifying, but it raises the need to review maintenance and wear.",
    ownerHistory: "Two prior owners reported. Worth confirming consistent maintenance across them.",
    recallCpoWarranty:
      "Not certified pre-owned. Open recalls have not been checked. Any remaining factory warranty and its transferability should be confirmed with the manufacturer.",
    missingInformation:
      "Full vehicle history report, title document, itemized out-the-door price, and an independent inspection are not yet available — each is needed for a higher-confidence call.",
  },
  pricingReview: {
    askingPriceConcern:
      "Based on the information reviewed, the $20,995 asking price can only be judged once the accident, rental use, and condition are verified — a range with a confidence level, not a single value.",
    outTheDoorConcern:
      "No out-the-door price has been provided. Until it's itemized in writing, the true cost of the deal isn't visible.",
    dealerFeeAddOnConcern:
      "Dealer fees and add-ons aren't visible without the itemized out-the-door figure; review them once provided.",
    tooGoodToBeTrueConcern:
      "Nothing in this sample flags the price as unusually low, but the reported accident and rental use mean the price should reflect those factors.",
    needsWrittenClarification:
      "Needs written clarification: the full itemized out-the-door price, the title-status disclosure, and the accident/repair records.",
  },
  inspectionPriorities: {
    mechanical: [
      "An independent pre-purchase inspection by a mechanic the buyer chooses — not one arranged by the seller.",
      "Engine, transmission, and a diagnostic scan for stored fault codes.",
    ],
    bodyFrame: [
      "A check for prior collision or structural repair tied to the reported accident — panel gaps, paint matching, and frame/unibody condition.",
    ],
    tireBrakeWear: [
      "Tires, brakes, suspension, and fluids appropriate to 68,400 miles and the prior rental use.",
    ],
    titleDocument: [
      "Confirmation of the title status against the actual title document or a written disclosure.",
    ],
    recallCpo: [
      "Open-recall status by VIN at the manufacturer or NHTSA, and confirmation of any completed repairs.",
    ],
  },
  sellerQuestions: {
    beforeMovingForward: [
      "Can I take the car to my own mechanic for a pre-purchase inspection before we go further?",
      "What does the full history report show for the reported accident, and can I see it?",
      "Can you confirm how the vehicle was used and provide the maintenance records?",
    ],
    requireWrittenAnswers: [
      "Can you provide the full out-the-door price in writing, with every fee itemized?",
      "Can you provide the title document or a written title-status disclosure?",
      "Can you provide the accident and repair records in writing?",
    ],
  },
  decisionTriggers: {
    walkAwaySignals: [
      "If the inspection finds structural or frame damage that wasn't disclosed, treat it as a strong walk-away signal and don't rely only on the seller's explanation.",
      "If the title document doesn't match the listing's clean-title claim, that's a strong walk-away signal pending independent verification.",
    ],
    inspectFirstSignals: [
      "The reported moderate accident and prior rental use both call for an independent inspection before signing.",
      "Open recalls should be checked before a final decision.",
    ],
    renegotiateOrVerifySignals: [
      "Once the inspection and history report are in hand, the price may need to change to reflect the accident and rental use.",
    ],
    needsDocumentsSignals: [
      "The out-the-door price, title document, full history report, and inspection are all still missing — gather them before a high-confidence call.",
    ],
  },
  buyerScripts: {
    beforeSigning:
      "Before I sign anything, I need the full history report, the title document, an itemized out-the-door price, and my own mechanic's inspection. I'm not deciding until I've reviewed all of it.",
    inspectionRequest:
      "I'd like to take the car to my own mechanic for a pre-purchase inspection before we go any further. Can we arrange that this week?",
    missingHistory:
      "I don't have a full vehicle history report yet. Can you provide one for this VIN in writing, including the accident and title details?",
    priceOtdClarification:
      "Please send me the full out-the-door price in writing, with every tax, fee, doc fee, and add-on itemized, so I can review the real cost.",
    alreadySigned:
      "I've already signed and I'm reviewing the vehicle's history and condition. Please send me the title document, the full history report, and the inspection records in writing so I can review them, and I'll seek independent verification.",
  },
  documentChecklist: [
    "Buyer's order or written quote",
    "Retail installment contract (if already signed)",
    "Full vehicle history report for the VIN",
    "Title document or written title-status disclosure",
    "Independent pre-purchase inspection report",
    "The dealer listing",
    "The full out-the-door price quote, itemized",
    "Open-recall status by VIN (manufacturer or NHTSA)",
    "CPO inspection checklist and coverage (if CPO is claimed)",
    "Warranty or service-contract documents (if applicable)",
  ],
  disclaimers: [
    "This is a sample report built from fake data — it is not a real customer report and not a completed paid review.",
    "Decision support, not advice. This is a buyer-side reference point, not legal, financial, tax, insurance, title, mechanical, or safety advice.",
    "It does not determine a vehicle's condition, and it does not determine title legality or title status — those need independent verification.",
    "It does not guarantee a vehicle's condition, reliability, a refund, savings, a cancellation, an approval, or any outcome.",
    "It does not accuse any seller or dealer of misconduct; it points the buyer toward independent verification.",
    "We do not sell cars, warranties, insurance, loans, inspections, or protection products, and we receive no commissions.",
    "We are strictly on the buyer's side: no kickbacks, and we never steer you toward any dealer, lender, seller, or product provider.",
    "Every estimate is a range with a confidence level — exact prices vary, and we never invent a precise single figure.",
  ],
};
