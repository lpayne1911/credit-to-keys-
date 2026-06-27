/**
 * ============================================================================
 *  Driveway Advocate — F&I Product Review: human-delivered package model
 * ============================================================================
 *
 * This module defines the SHAPE of the paid, human-delivered F&I Product Review
 * deliverable and ships a single fully-worked SAMPLE built entirely from FAKE
 * data. It is used to render the public "sample report" page so a buyer can see
 * what the paid package looks like before it is purchasable.
 *
 * Nothing here is a real customer report, a legal determination, or a paid
 * service. The same compliance rules as the rest of the product apply:
 *  - Buyer-side only. No commissions, no kickbacks, no steering.
 *  - No false precision. Estimates are ranges with a confidence level; we never
 *    invent an exact "fair price."
 *  - No legal/fraud conclusions, no guaranteed cancellation/refund/savings.
 *  - Decision support, not financial, legal, tax, or insurance advice.
 *
 * No AI, no network, no persistence — this is static, typed sample content.
 * ============================================================================
 */

export type ProductConcernLevel = "low" | "medium" | "high";

/** One of the product-level recommendation labels (mirrors the pilot engine). */
export type ReportProductLabel =
  | "worth_considering"
  | "only_if_discounted"
  | "challenge_hard"
  | "cancel_if_possible"
  | "dangerous_or_misrepresented"
  | "needs_documents";

export const REPORT_PRODUCT_LABEL_DISPLAY: Record<ReportProductLabel, string> = {
  worth_considering: "Worth considering",
  only_if_discounted: "Only if discounted",
  challenge_hard: "Challenge hard",
  cancel_if_possible: "Cancel if possible",
  dangerous_or_misrepresented: "Dangerous or misrepresented",
  needs_documents: "Needs documents",
};

export interface ReportHeader {
  title: string;
  /** Always flags this as fake, illustrative content. */
  kind: string;
  preparedFor: string;
  reference: string;
  /** A static, human-readable label — never a real timestamp. */
  preparedOn: string;
  summary: string;
}

export interface DealSnapshot {
  vehicle: string;
  mileage: string;
  condition: string;
  signedStatus: string;
  purchaseState: string;
  vehiclePrice: string;
  notes: string;
}

export interface ProductInventoryItem {
  name: string;
  category: string;
  price: string;
  term: string;
  mileageLimit: string;
  deductible: string;
  inContract: string;
  toldRequired: string;
  cancellationVisible: string;
  keyConcern: string;
}

export interface ProductAnalysis {
  name: string;
  label: ReportProductLabel;
  concernLevel: ProductConcernLevel;
  /** What the reviewer observed — observations, never legal conclusions. */
  observations: string[];
  /** Open items the buyer should resolve in writing. */
  questionsToResolve: string[];
  /** The reviewer's range-based read, with a confidence level. */
  referenceRead: string;
}

export interface ChallengeItem {
  product: string;
  issue: string;
  ask: string;
}

export interface CancelOrKeepItem {
  product: string;
  /** "Keep (verify)", "Lean keep if discounted", "Lean cancel", "Resolve first". */
  stance: string;
  rationale: string;
}

export interface BuyerScripts {
  beforeSigning: string;
  afterSigning: string;
  cancellationRequest: string;
  requiredClaim: string;
}

export interface FiProductReport {
  header: ReportHeader;
  dealSnapshot: DealSnapshot;
  productInventory: ProductInventoryItem[];
  productAnalysis: ProductAnalysis[];
  challengeList: ChallengeItem[];
  cancelOrKeepPlan: CancelOrKeepItem[];
  buyerScripts: BuyerScripts;
  documentChecklist: string[];
  disclaimers: string[];
}

// ---------------------------------------------------------------------------
//  SAMPLE REPORT — FAKE DATA ONLY
// ---------------------------------------------------------------------------

export const SAMPLE_FI_REPORT: FiProductReport = {
  header: {
    title: "Sample F&I Product Review Report",
    kind: "Illustrative sample — fake data, not a real customer report",
    preparedFor: "Sample Buyer (illustrative)",
    reference: "SAMPLE-FI-0001",
    preparedOn: "Sample report — no real date",
    summary:
      "This is a sample of the human-delivered F&I Product Review. It shows how a reviewer lays out the finance-office products on a deal, what to challenge, and what to ask — as a buyer-side reference point, not a legal determination. All names, numbers, and findings below are fictional.",
  },
  dealSnapshot: {
    vehicle: "2022 Toyota Camry SE",
    mileage: "42,300 miles",
    condition: "Used",
    signedStatus: "Already signed",
    purchaseState: "Maryland",
    vehiclePrice: "$24,850",
    notes:
      "Buyer signed at the dealership and is reviewing the finance-office products after the fact. Figures are taken from the sample buyer's order and are illustrative only.",
  },
  productInventory: [
    {
      name: "Platinum Vehicle Service Contract",
      category: "Vehicle service contract / extended warranty",
      price: "$3,495",
      term: "84 months",
      mileageLimit: "100,000 miles",
      deductible: "$100",
      inContract: "Yes",
      toldRequired: "Not sure",
      cancellationVisible: "Yes",
      keyConcern:
        "Price appears high enough to challenge, and coverage may overlap with protection that may still remain on the vehicle.",
    },
    {
      name: "GAP Waiver",
      category: "GAP",
      price: "$995",
      term: "Loan term",
      mileageLimit: "Not applicable",
      deductible: "Not applicable",
      inContract: "Yes",
      toldRequired: "No",
      cancellationVisible: "Not sure",
      keyConcern:
        "Needs review against the down payment, any negative equity, the loan-to-value, and the insurance and lender terms.",
    },
    {
      name: "Paint and Interior Protection",
      category: "Paint / interior / ceramic / appearance",
      price: "$1,295",
      term: "Not clear",
      mileageLimit: "Not applicable",
      deductible: "Not clear",
      inContract: "Yes",
      toldRequired: "Yes",
      cancellationVisible: "No",
      keyConcern:
        "An optional product that appears packed into the deal; it should be challenged or clarified in writing.",
    },
  ],
  productAnalysis: [
    {
      name: "Platinum Vehicle Service Contract",
      label: "challenge_hard",
      concernLevel: "high",
      observations: [
        "At $3,495 on an 84-month / 100,000-mile term, this is a large add to the financed balance and appears worth challenging.",
        "Coverage may overlap with protection that could still remain on the vehicle; the overlap is worth confirming before keeping it.",
        "Because the deal is already signed, treat this as something to challenge and, if it does not hold up, to ask about cancelling.",
      ],
      questionsToResolve: [
        "Ask for the full service-contract booklet, including the coverage, term, mileage limit, deductible, and exclusions, in writing.",
        "Confirm how much manufacturer coverage, if any, still remains and when this contract would actually start to apply.",
        "Ask whether the price can be reduced or the product removed, and request the cancellation form and written confirmation of any refund, if applicable.",
      ],
      referenceRead:
        "Reference read: the price looks high for the coverage described — given as a range with a confidence level, not a single exact number, and offered with medium confidence given the documents provided. Confirm the terms with the contract or provider.",
    },
    {
      name: "GAP Waiver",
      label: "needs_documents",
      concernLevel: "medium",
      observations: [
        "GAP can matter when there is a small down payment or negative equity, and matter less otherwise; the available documents are not enough to make a high-confidence call.",
        "Cancellation language was not clearly visible in the sample paperwork, so the cancellation terms should be confirmed in writing.",
      ],
      questionsToResolve: [
        "Confirm the down payment, any negative equity, and the loan-to-value so the value of GAP can be weighed.",
        "Confirm how this GAP waiver interacts with the buyer's own insurance and the lender's terms.",
        "Request the cancellation form and written confirmation of any refund, if applicable.",
      ],
      referenceRead:
        "Reference read: too few details to land a confident call — this is a buyer-side reference point, not a legal determination. Gather the documents listed below and revisit.",
    },
    {
      name: "Paint and Interior Protection",
      label: "dangerous_or_misrepresented",
      concernLevel: "high",
      observations: [
        "This is an optional appearance product that the sample notes say was presented as required — that claim should not be accepted without written proof from the lender.",
        "At $1,295 with an unclear term and no visible cancellation language, it appears packed into the deal and should be challenged or clarified in writing.",
      ],
      questionsToResolve: [
        "Ask for written proof from the lender if anyone states this product is required.",
        "Ask for the product's term, what it covers, and the cancellation terms in writing.",
        "Request the cancellation form and written confirmation of any refund, if applicable.",
      ],
      referenceRead:
        "Reference read: appears worth challenging and clarifying in writing — a buyer-side reference point, not a legal determination. Confirm the terms with the contract or provider.",
    },
  ],
  challengeList: [
    {
      product: "Platinum Vehicle Service Contract",
      issue:
        "Price appears high for the coverage described, and coverage may overlap with protection that could still remain on the vehicle.",
      ask: "Ask the finance office to itemize and justify the price, confirm the remaining coverage, and put any reduction in writing.",
    },
    {
      product: "Paint and Interior Protection",
      issue:
        "An optional product appears to have been presented as required and packed into the deal, with no visible cancellation language.",
      ask: "Ask for written proof from the lender of any requirement, and request the term, coverage, and cancellation terms in writing.",
    },
    {
      product: "GAP Waiver",
      issue:
        "The value of GAP depends on facts not yet confirmed, and the cancellation terms were not clearly visible.",
      ask: "Confirm the down payment, negative equity, loan-to-value, and insurer/lender terms, and request the cancellation terms in writing.",
    },
  ],
  cancelOrKeepPlan: [
    {
      product: "Platinum Vehicle Service Contract",
      stance: "Challenge first, then decide",
      rationale:
        "Push back on the price and confirm the coverage overlap. If it does not hold up, ask about cancelling and request written confirmation of any refund, if applicable.",
    },
    {
      product: "GAP Waiver",
      stance: "Resolve documents first",
      rationale:
        "Gather the down payment, negative equity, loan-to-value, and insurer/lender terms before deciding whether to keep it.",
    },
    {
      product: "Paint and Interior Protection",
      stance: "Lean challenge or cancel",
      rationale:
        "Because it appears optional, packed in, and presented as required, ask for written proof and the cancellation form, and request written confirmation of any refund, if applicable.",
    },
  ],
  buyerScripts: {
    beforeSigning:
      "Before I sign anything, I want each finance-office product itemized with its price, term, coverage, and cancellation terms in writing. Please remove anything I haven't agreed to.",
    afterSigning:
      "I've already signed, and I'm reviewing the add-ons on my contract. Please send me each product's contract, the price, and the cancellation terms in writing so I can review them.",
    cancellationRequest:
      "I'd like to cancel this product. Please give me the cancellation form and written confirmation of any refund amount and timing, if applicable.",
    requiredClaim:
      "I was told this product was required. Please show me written proof from the lender that it's required for my loan. Otherwise, please remove it.",
  },
  documentChecklist: [
    "Buyer's order / purchase agreement",
    "Retail installment contract or lease agreement",
    "Each F&I product's contract or brochure (coverage, term, mileage, deductible)",
    "Cancellation / refund terms for each product",
    "The finance-office product menu you were shown",
    "Any remaining manufacturer coverage (months / miles)",
    "Down payment, trade payoff, and loan-to-value figures (for the GAP review)",
  ],
  disclaimers: [
    "This is a sample report built from fake data — it is not a real customer report and not a completed paid review.",
    "Decision support, not advice. This is a buyer-side reference point, not financial, legal, tax, or insurance advice, and not a legal determination.",
    "We are strictly on the buyer's side: we never take money from, or steer you toward, any dealer, lender, finance office, warranty company, or product provider. No commissions, no kickbacks, ever.",
    "Every estimate is a range with a confidence level — exact prices vary, and we never invent a precise single figure.",
    "Nothing here guarantees a cancellation, a refund, an approval, or a specific savings amount. Confirm every product's terms with your contract, the provider, your lender, or a qualified professional.",
  ],
};
