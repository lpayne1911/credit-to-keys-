/**
 * ============================================================================
 *  Driveway Advocate — F&I Product Review (pilot engine)
 * ============================================================================
 *
 * A self-contained, deterministic, rule-based engine that turns a buyer's
 * description of the finance-office (F&I) products on their deal into a
 * buyer-side REVIEW PREVIEW — never a paid, completed, or legal determination.
 *
 * It mirrors the design rules of the fairness engine:
 *  - Buyer-side only. No reference to a dealer/lender/warranty partner or any
 *    commission. Every output serves the buyer.
 *  - No false precision. We never assert an exact market "fair price." Price
 *    thresholds below are transparent "this is a large charge" heuristics used
 *    only to decide whether to scrutinize a line — not fair-value claims.
 *  - No legal claims. We never say a product is "illegal" or "legally
 *    cancellable." We tell the buyer to ASK for the cancellation form and to
 *    require written proof before accepting a "required" claim.
 *  - Decision support, not advice. Disclaimer copy lives in the UI.
 *
 * No AI calls. No network. No database. Pure function: same input → same output.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
//  INPUT TYPES
// ---------------------------------------------------------------------------

export type SignedStatus = "not_yet" | "signed" | "not_sure";

export type VehicleCondition = "new" | "used" | "cpo" | "lease" | "not_sure";

/** A three-state answer used for the per-product yes/no/unsure questions. */
export type YesNoUnsure = "yes" | "no" | "not_sure";

export type ProductCategory =
  | "vsc"
  | "gap"
  | "tire_wheel"
  | "maintenance"
  | "key"
  | "dent_windshield"
  | "theft_etch"
  | "appearance"
  | "other";

export type Concern =
  | "overpriced"
  | "told_required"
  | "packed_into_payment"
  | "dont_understand"
  | "already_signed_cancel"
  | "duplicates_factory"
  | "need_script";

export interface FiVehicleInput {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  mileage?: number | null;
  purchaseState?: string | null;
  price?: number | null;
  termMonths?: number | null;
  apr?: number | null;
  downPayment?: number | null;
}

export interface FiProductInput {
  category: ProductCategory;
  name?: string | null;
  price?: number | null;
  termMonths?: number | null;
  mileageLimit?: number | null;
  deductible?: number | null;
  toldRequired: YesNoUnsure;
  cancellationVisible: YesNoUnsure;
  inContract: YesNoUnsure;
}

export interface FiReviewInput {
  signed: SignedStatus;
  vehicleCondition: VehicleCondition;
  vehicle: FiVehicleInput;
  products: FiProductInput[];
  concerns: Concern[];
}

// ---------------------------------------------------------------------------
//  OUTPUT TYPES
// ---------------------------------------------------------------------------

export type ProductLabel =
  | "worth_considering"
  | "only_if_discounted"
  | "challenge_hard"
  | "cancel_if_possible"
  | "dangerous_or_misrepresented";

export type OverallLabel =
  | "low_concern"
  | "review_before_signing"
  | "challenge_before_signing"
  | "cancel_or_escalate"
  | "needs_documents";

export type Confidence = "low" | "medium" | "high";

export type ConcernLevel = "low" | "medium" | "high";

export interface FiProductResult {
  category: ProductCategory;
  categoryLabel: string;
  name: string | null;
  label: ProductLabel;
  displayLabel: string;
  concernLevel: ConcernLevel;
  reasons: string[];
  questionsToAsk: string[];
  suggestedScript: string;
}

export interface FiReviewResult {
  overallLabel: OverallLabel;
  overallDisplayLabel: string;
  overallSummary: string;
  confidence: Confidence;
  productResults: FiProductResult[];
  nextSteps: string[];
  documentChecklist: string[];
}

// ---------------------------------------------------------------------------
//  DISPLAY LABELS
// ---------------------------------------------------------------------------

export const PRODUCT_LABEL_DISPLAY: Record<ProductLabel, string> = {
  worth_considering: "Worth considering",
  only_if_discounted: "Only if discounted",
  challenge_hard: "Challenge hard",
  cancel_if_possible: "Cancel if possible",
  dangerous_or_misrepresented: "Dangerous or misrepresented",
};

export const OVERALL_LABEL_DISPLAY: Record<OverallLabel, string> = {
  low_concern: "Low concern",
  review_before_signing: "Review before signing",
  challenge_before_signing: "Challenge before signing",
  cancel_or_escalate: "Cancel or escalate",
  needs_documents: "Needs documents",
};

export const CATEGORY_DISPLAY: Record<ProductCategory, string> = {
  vsc: "Vehicle service contract / extended warranty",
  gap: "GAP",
  tire_wheel: "Tire and wheel",
  maintenance: "Maintenance plan",
  key: "Key replacement",
  dent_windshield: "Dent / windshield",
  theft_etch: "Theft / GPS / VIN etch",
  appearance: "Paint / interior / ceramic / appearance",
  other: "Other add-on",
};

const CONCERN_LEVEL: Record<ProductLabel, ConcernLevel> = {
  worth_considering: "low",
  only_if_discounted: "medium",
  challenge_hard: "medium",
  cancel_if_possible: "high",
  dangerous_or_misrepresented: "high",
};

// ---------------------------------------------------------------------------
//  HEURISTICS (transparent, NOT fair-price claims)
// ---------------------------------------------------------------------------

/**
 * "This is a large charge worth scrutinizing" thresholds, per category. These
 * are deliberately blunt and conservative — they decide only whether to ask the
 * desk to justify a price, NEVER what the product is "really worth."
 */
const LARGE_CHARGE: Record<ProductCategory, number> = {
  vsc: 2500,
  gap: 900,
  tire_wheel: 1200,
  maintenance: 1500,
  key: 600,
  dent_windshield: 1000,
  theft_etch: 500,
  appearance: 1200,
  other: 1500,
};

/**
 * Add-ons whose value most often overlaps coverage the buyer may already have
 * (factory warranty, insurance, roadside) — worth a duplication question.
 */
const FACTORY_OVERLAP: ProductCategory[] = ["vsc", "maintenance", "key", "dent_windshield"];

/**
 * Category-specific questions for the finance office. These never advise — they
 * point the buyer at the facts they'd need to decide, and never claim a product
 * is good or bad in all cases.
 */
const CATEGORY_QUESTIONS: Partial<Record<ProductCategory, string>> = {
  gap: "Do you have a small down payment or negative equity (owing more than the car is worth)? GAP may matter more then — confirm your loan-to-value and how it interacts with your insurer's payout before deciding.",
  vsc: "How many months and miles of the manufacturer's warranty are still on this vehicle, and when would this contract actually start covering?",
  maintenance: "Does this duplicate any scheduled maintenance the manufacturer already includes?",
};

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * Parse a user-typed numeric field that may carry "$", ",", "%", or stray
 * spaces (the inputs show placeholders like "$26,000"). Returns null for blank,
 * garbage, or negative input — never NaN, never a negative, never a stray 0.
 */
export function parseNumericInput(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function hasPrice(p: FiProductInput): p is FiProductInput & { price: number } {
  return typeof p.price === "number" && Number.isFinite(p.price) && p.price > 0;
}

// ---------------------------------------------------------------------------
//  PRODUCT-LEVEL SCORING
// ---------------------------------------------------------------------------

interface ProductSignals {
  priceMissing: boolean;
  largeCharge: boolean;
  toldRequired: boolean;
  maybeRequired: boolean;
  inContract: boolean;
  signed: boolean;
  packed: boolean;
  unclearCoverage: boolean;
  wantsCancel: boolean;
  duplicatesFactory: boolean;
  /** How many fields we'd need to give a confident read are missing. */
  missingCritical: number;
}

function signalsFor(p: FiProductInput, input: FiReviewInput): ProductSignals {
  const concerns = input.concerns;
  const priceMissing = !hasPrice(p);
  const termsBlank = p.termMonths == null && p.mileageLimit == null;
  return {
    priceMissing,
    largeCharge: hasPrice(p) && p.price >= LARGE_CHARGE[p.category],
    toldRequired: p.toldRequired === "yes" || concerns.includes("told_required"),
    maybeRequired: p.toldRequired === "not_sure",
    inContract: p.inContract === "yes",
    signed: input.signed === "signed",
    packed: concerns.includes("packed_into_payment"),
    unclearCoverage: concerns.includes("dont_understand") || termsBlank,
    wantsCancel: concerns.includes("already_signed_cancel"),
    duplicatesFactory:
      concerns.includes("duplicates_factory") || FACTORY_OVERLAP.includes(p.category),
    missingCritical: [
      priceMissing,
      p.inContract === "not_sure",
      p.cancellationVisible === "not_sure",
      termsBlank,
    ].filter(Boolean).length,
  };
}

function labelFor(s: ProductSignals): ProductLabel {
  // 1) Misrepresentation is the most serious: an optional add-on presented as
  //    required, or a large packed charge already baked into a signed/contracted
  //    deal. (These add-ons are typically optional; the engine never asserts a
  //    lender's actual requirements — it tells the buyer to ask for written proof.)
  if (s.toldRequired) return "dangerous_or_misrepresented";
  if (s.packed && s.largeCharge && (s.signed || s.inContract)) {
    return "dangerous_or_misrepresented";
  }

  // 2) If the deal is effectively done (signed or already in the contract) and
  //    there's a value concern, the move is to try to cancel.
  if (
    (s.signed || s.inContract) &&
    (s.largeCharge || s.wantsCancel || s.unclearCoverage || s.priceMissing)
  ) {
    return "cancel_if_possible";
  }

  // 3) Not yet committed, with a pressure or clarity problem — a "required"
  //    hint, payment-packing, unclear coverage, or no price to judge → challenge
  //    it now, before signing.
  if (
    !s.signed &&
    (s.maybeRequired || s.packed || s.unclearCoverage || s.priceMissing)
  ) {
    return "challenge_hard";
  }

  // 4) Not committed and simply expensive, with no pressure or clarity flag —
  //    it may have value, but only at a better price.
  if (!s.signed && s.largeCharge) return "only_if_discounted";

  // 5) Price entered and not obviously high, terms reasonably clear, no required
  //    claim, no packing, no cancellation concern.
  if (!s.priceMissing && !s.unclearCoverage) return "worth_considering";

  // Fallback when we simply don't have enough to lean positive: stay cautious.
  return "only_if_discounted";
}

function reasonsFor(
  p: FiProductInput,
  s: ProductSignals,
  label: ProductLabel,
): string[] {
  const out: string[] = [];

  if (s.toldRequired) {
    out.push(
      "You were told (or weren't sure whether) this was required. Add-ons like this are typically optional — ask for written proof from your lender before accepting any \"required\" claim.",
    );
  }
  if (s.packed) {
    out.push(
      "It was packed into the monthly payment, which hides the real price. Look at the dollar amount, not the payment.",
    );
  }
  if (s.largeCharge && hasPrice(p)) {
    out.push(
      `At ${money(p.price)}, this is a large add to your loan. Ask the finance office to itemize and justify it — this is a buyer-side reference point, not a fair-price ruling.`,
    );
  }
  if (s.priceMissing) {
    out.push(
      "No price was entered, so we can't gauge the charge. Ask for the exact dollar amount in writing.",
    );
  }
  if (s.inContract) {
    out.push(
      "It's already written into the contract. Ask for the cancellation form and written confirmation of any refund.",
    );
  }
  if (s.unclearCoverage) {
    out.push(
      "The coverage, term, or mileage limit isn't clear. Ask for the full contract before deciding what it's worth.",
    );
  }
  if (s.duplicatesFactory) {
    out.push(
      "This may overlap coverage you already have (factory warranty, insurance, or roadside). Confirm it isn't a duplicate.",
    );
  }
  if (s.missingCritical >= 2) {
    out.push(
      "Several key details are missing, so this read is tentative. Gather the documents below to firm it up.",
    );
  }

  if (out.length === 0) {
    if (label === "worth_considering") {
      out.push(
        "Nothing here tripped a concern, but still get the full terms and cancellation policy in writing before you commit.",
      );
    } else {
      out.push("Ask for the full terms and price in writing before you decide.");
    }
  }
  return out;
}

function questionsFor(p: FiProductInput, s: ProductSignals): string[] {
  const q: string[] = [
    "Can I see the full product contract — coverage, term, mileage limit, and deductible — in writing?",
    "What is the exact price of this product, and can it be removed or reduced?",
  ];
  if (s.toldRequired) {
    q.push(
      "Can you show me written proof from the lender that this product is required to get the loan?",
    );
  }
  if (s.signed || s.inContract) {
    q.push(
      "What is the cancellation process, and what refund, if any, would apply if I cancel?",
    );
  }
  if (s.duplicatesFactory) {
    q.push(
      "How does this overlap with the factory warranty or coverage I already have?",
    );
  }
  if (s.packed) {
    q.push("Can you show me this product's price as a dollar amount, not a payment?");
  }
  const catQ = CATEGORY_QUESTIONS[p.category];
  if (catQ) q.push(catQ);
  return q;
}

function scriptFor(label: ProductLabel): string {
  switch (label) {
    case "dangerous_or_misrepresented":
      return "I was told this was required. Please remove it, or show me written proof from the lender that it's required. Otherwise I won't sign with it included.";
    case "cancel_if_possible":
      return "I'd like to cancel this product. Please give me the cancellation form and written confirmation of any refund amount and timing.";
    case "challenge_hard":
      return "Take this off the deal, or show me the full coverage terms and a lower price in writing. I'm not paying for it as it stands.";
    case "only_if_discounted":
      return "I'll only keep this if you show me the full terms and a meaningfully lower price in writing. Otherwise, please remove it.";
    case "worth_considering":
      return "Before I decide, please show me the full contract, the price, and the cancellation terms in writing so I can compare.";
  }
}

function reviewProduct(p: FiProductInput, input: FiReviewInput): FiProductResult {
  const s = signalsFor(p, input);
  const label = labelFor(s);
  return {
    category: p.category,
    categoryLabel: CATEGORY_DISPLAY[p.category],
    name: p.name?.trim() ? p.name.trim() : null,
    label,
    displayLabel: PRODUCT_LABEL_DISPLAY[label],
    concernLevel: CONCERN_LEVEL[label],
    reasons: reasonsFor(p, s, label),
    questionsToAsk: questionsFor(p, s),
    suggestedScript: scriptFor(label),
  };
}

// ---------------------------------------------------------------------------
//  OVERALL ROLL-UP
// ---------------------------------------------------------------------------

const OVERALL_SUMMARY: Record<OverallLabel, string> = {
  low_concern:
    "Nothing you entered raised a clear red flag, but this is only a preview — still get every product's terms, price, and cancellation policy in writing before you commit.",
  review_before_signing:
    "There are products here worth a closer look before you sign. Get the terms and prices in writing and decide line by line.",
  challenge_before_signing:
    "At least one product looks worth challenging before you sign — push back on price, on any \"required\" claim, and on anything packed into the payment.",
  cancel_or_escalate:
    "Because the deal looks signed or already contracted, the move is to ask about cancelling the products of concern and to escalate in writing.",
  needs_documents:
    "Too much is missing to give a confident read. Gather the documents below and run the preview again with the prices and terms filled in.",
};

function rollUp(input: FiReviewInput, products: FiProductResult[], docStarved: boolean): OverallLabel {
  if (products.length === 0 || docStarved) return "needs_documents";

  const signedish = input.signed === "signed";
  const anyCancel = products.some((r) => r.label === "cancel_if_possible");
  const anyDangerous = products.some((r) => r.label === "dangerous_or_misrepresented");
  const anyChallenge = products.some((r) => r.label === "challenge_hard");
  const anyDiscount = products.some((r) => r.label === "only_if_discounted");
  const wantsCancel = input.concerns.includes("already_signed_cancel");

  if (signedish && (anyCancel || anyDangerous || wantsCancel)) return "cancel_or_escalate";
  if (anyDangerous || anyChallenge) return "challenge_before_signing";
  if (anyCancel) return "cancel_or_escalate";
  if (anyDiscount) return "review_before_signing";
  return "low_concern";
}

function confidenceFor(input: FiReviewInput): Confidence {
  if (input.products.length === 0) return "low";

  let total = 0;
  let missing = 0;
  const note = (present: boolean) => {
    total += 1;
    if (!present) missing += 1;
  };

  note(input.signed !== "not_sure");
  note(typeof input.vehicle.price === "number" && input.vehicle.price > 0);
  note(input.vehicle.year != null);
  note(!!input.vehicle.make);
  note(!!input.vehicle.model);
  note(input.vehicle.mileage != null);

  for (const p of input.products) {
    note(hasPrice(p));
    note(p.inContract !== "not_sure");
    note(p.cancellationVisible !== "not_sure");
    note(p.termMonths != null || p.mileageLimit != null);
  }

  const ratio = missing / total;
  if (ratio <= 0.2) return "high";
  if (ratio <= 0.5) return "medium";
  return "low";
}

function nextStepsFor(input: FiReviewInput, products: FiProductResult[]): string[] {
  const steps: string[] = [
    "This flow is a reference point, not a legal determination or a completed paid review.",
  ];
  if (products.some((r) => r.label === "dangerous_or_misrepresented")) {
    steps.push(
      "Do not accept a claim that any add-on is required without written proof from your lender.",
    );
  }
  if (input.signed === "signed" || input.concerns.includes("already_signed_cancel")) {
    steps.push(
      "If you've already signed, gather your contract and ask the finance office for each product's cancellation form and written confirmation of any refund.",
    );
  }
  if (input.concerns.includes("packed_into_payment")) {
    steps.push(
      "Ask to see each product as a dollar amount, not a monthly payment, so the real price is visible.",
    );
  }
  steps.push(
    "Get every add-on's price, term, and coverage in writing before you agree to keep it.",
  );
  steps.push("Keep the answers to your questions in writing, then re-run this preview.");
  return steps;
}

function documentChecklist(input: FiReviewInput): string[] {
  const docs: string[] = [
    "Buyer's order / purchase agreement",
    "Retail installment contract or lease agreement",
    "Each F&I product's contract or brochure (coverage, term, mileage, deductible)",
    "Cancellation / refund terms for each product",
    "The finance-office product menu you were shown",
  ];
  const cats = new Set(input.products.map((p) => p.category));
  if (cats.has("vsc") || input.concerns.includes("duplicates_factory")) {
    docs.push("Your factory warranty coverage (months / miles remaining)");
  }
  if (cats.has("gap")) {
    docs.push("Any GAP waiver addendum and your loan-to-value figures");
  }
  return docs;
}

// ---------------------------------------------------------------------------
//  PUBLIC ENTRY POINT
// ---------------------------------------------------------------------------

export function reviewFiProducts(input: FiReviewInput): FiReviewResult {
  const productResults = input.products.map((p) => reviewProduct(p, input));

  // "Needs documents" when, across the products entered, most are missing the
  // critical fields we'd need to give a confident read.
  const starvedCount = input.products.filter(
    (p) => signalsFor(p, input).missingCritical >= 2,
  ).length;
  const docStarved =
    input.products.length > 0 &&
    starvedCount >= Math.ceil(input.products.length / 2);

  const overallLabel = rollUp(input, productResults, docStarved);

  // With nothing entered, say plainly that a product is needed rather than the
  // generic "documents missing" copy.
  const overallSummary =
    input.products.length === 0
      ? "Add at least one finance-office product to get a preview — this flow reviews the warranty, GAP, and add-ons on your deal."
      : OVERALL_SUMMARY[overallLabel];

  return {
    overallLabel,
    overallDisplayLabel: OVERALL_LABEL_DISPLAY[overallLabel],
    overallSummary,
    confidence: confidenceFor(input),
    productResults,
    nextSteps: nextStepsFor(input, productResults),
    documentChecklist: documentChecklist(input),
  };
}
