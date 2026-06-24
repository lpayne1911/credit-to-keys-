/**
 * ============================================================================
 *  Driveway Advocate — Fairness Engine
 * ============================================================================
 *
 * This is the single, self-contained module that turns a buyer's deal into a
 * verdict. It is "the fairness brain." ALL pricing assumptions and scoring
 * math live here and NOWHERE else — the UI, API routes, and database treat
 * this file as a black box behind the {@link scoreDeal} interface.
 *
 * ---------------------------------------------------------------------------
 *  HOW TO REPLACE THIS WITH THE REAL ENGINE
 * ---------------------------------------------------------------------------
 *  The owner has a real market-research-backed warranty pricing engine, a
 *  risk-scoring model, and seed data (TypeScript + Python) from the
 *  `backup/main-warranty-pricing-app` branch of an older repo. That code is
 *  NOT available during this build, so every number below is a transparent,
 *  documented PLACEHOLDER — an honest assumption range, never a fabricated
 *  exact "fair price."
 *
 *  To drop in the real engine, re-implement ONLY the body of `scoreDeal`
 *  (and the helpers it calls) so it satisfies the SAME input/output types
 *  exported here. Do not change the types without updating the callers. The
 *  UI and DB must keep working with zero changes.
 *
 *  Every placeholder constant is tagged:
 *      // PLACEHOLDER — replace with real engine value
 *  and is sourced to a STATED ASSUMPTION, not a made-up precise figure.
 *
 * ---------------------------------------------------------------------------
 *  GUARANTEES THIS MODULE MUST KEEP (compliance + product)
 * ---------------------------------------------------------------------------
 *  - Buyer-side only. Nothing here references a dealer/lender/warranty partner,
 *    a referral, or a kickback. Every output serves the buyer.
 *  - Never present false precision. Every estimate carries a CONFIDENCE level
 *    and a RANGE. Where data is thin, the confidence is "low" and the copy
 *    says so.
 *  - Decision support, not financial or legal advice. (Disclaimer copy lives
 *    in the UI; this module only produces support data.)
 * ============================================================================
 */

import { principalFromPayment, impliedAprPct } from "./loan-math";

// ---------------------------------------------------------------------------
//  INPUT TYPES
// ---------------------------------------------------------------------------

export interface VehicleInput {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage?: number | null;
  /** Optional — present if decoded from a VIN. Not required for scoring. */
  vin?: string | null;
}

export interface ItemizedFee {
  label: string;
  amount: number;
}

export interface DealInput {
  /** Advertised / agreed vehicle price (the "sale price"), before fees. */
  vehiclePrice?: number | null;
  /** Itemized dealer fees & add-ons. Free-form labels — matched heuristically. */
  fees?: ItemizedFee[];
  downPayment?: number | null;
  /** Annual percentage rate the dealer is offering on the loan, e.g. 9.9. */
  apr?: number | null;
  /** Loan term in months. */
  termMonths?: number | null;
  monthlyPayment?: number | null;
  /**
   * The buyer's self-reported credit band. Used ONLY to estimate the rate they
   * could likely qualify for, so we can flag dealer APR markup. Optional.
   */
  creditBand?: CreditBand | null;
}

export type CreditBand =
  | "excellent" // ~720+
  | "good" // ~660-719
  | "fair" // ~600-659
  | "poor" // ~500-599
  | "unknown";

export type WarrantyCoverageTier =
  | "powertrain"
  | "named_component"
  | "stated_component"
  | "exclusionary" // "bumper-to-bumper" — broadest
  | "unknown";

export interface WarrantyInput {
  provider?: string | null;
  coverageTier?: WarrantyCoverageTier | null;
  termMonths?: number | null;
  termMiles?: number | null;
  /** Price the dealer quoted for the extended warranty / VSC. */
  priceQuoted?: number | null;
}

export interface TradeInInput {
  /** What the dealer offered for the buyer's trade-in. */
  offer?: number | null;
  /**
   * The buyer's own researched value for their trade (e.g. KBB / Edmunds
   * trade-in value). Required to judge a lowball — we never price the trade
   * ourselves. Optional.
   */
  estimatedValue?: number | null;
  /** Remaining loan balance on the trade, if it's still financed. */
  loanPayoff?: number | null;
}

export interface FairnessInput {
  vehicle: VehicleInput;
  deal: DealInput;
  /** Optional — many buyers check a deal with no warranty attached. */
  warranty?: WarrantyInput | null;
  /** Optional — present only when the buyer is trading in a vehicle. */
  tradeIn?: TradeInInput | null;
}

// ---------------------------------------------------------------------------
//  OUTPUT TYPES
// ---------------------------------------------------------------------------

export type Verdict = "green" | "amber" | "red" | "black";

export type Confidence = "low" | "medium" | "high";

export type WarrantyPriceRating =
  | "fair"
  | "high"
  | "very_overpriced"
  | "negotiable";

export type FlagType =
  | "junk_fee"
  | "apr_markup"
  | "overpriced_addon"
  | "redundant_addon"
  | "overpriced_warranty"
  | "payment_packing"
  | "trade_lowball"
  | "negative_equity"
  | "missing_info"
  | "info";

export type FlagSeverity = "info" | "low" | "medium" | "high";

export interface Flag {
  type: FlagType;
  severity: FlagSeverity;
  /** Short headline, e.g. "Possible marked-up interest rate". */
  title: string;
  /** Plain-English, jargon-free explanation for a stressed buyer. */
  explanation: string;
  /** Optional dollar impact estimate — always a range, never false precision. */
  estimatedImpact?: PriceRange | null;
}

export interface PriceRange {
  low: number;
  high: number;
  confidence: Confidence;
  /** Honest note about what drives the range / where data is thin. */
  basis: string;
}

export interface WarrantyAssessment {
  rating: WarrantyPriceRating;
  /** Estimated FAIR price range for this warranty. Never an exact figure. */
  fairRange: PriceRange;
  quotedPrice: number | null;
  explanation: string;
}

export interface FairnessResult {
  overallVerdict: Verdict;
  /** One-line, plain-spoken summary of the verdict for the buyer. */
  headline: string;
  confidence: Confidence;
  flags: Flag[];
  /** Present only when a warranty was submitted. */
  warranty: WarrantyAssessment | null;
  /** Transparency: the assumptions used, so the buyer can sanity-check us. */
  assumptions: string[];
  /** Engine version — bump when the real engine replaces these placeholders. */
  engineVersion: string;
}

// ===========================================================================
//  PLACEHOLDER ASSUMPTION TABLES
//  Every value below is a documented assumption range, NOT a real quote.
//  Replace wholesale when the real engine + seed data are dropped in.
// ===========================================================================

const ENGINE_VERSION = "placeholder-0.1.0";

/**
 * Brand reliability tiers drive warranty risk: less reliable brands cost more
 * to cover, so a higher fair price is justified. This is a coarse, well-known
 * industry-consensus grouping — the real engine replaces it with the owner's
 * risk-scoring model + seed data.
 *
 * tier 1 = most reliable (lowest expected claims), tier 3 = least reliable.
 */
// PLACEHOLDER — replace with real engine value (owner's brand risk model)
const BRAND_RELIABILITY_TIER: Record<string, 1 | 2 | 3> = {
  toyota: 1,
  lexus: 1,
  honda: 1,
  acura: 1,
  mazda: 1,
  subaru: 2,
  hyundai: 2,
  kia: 2,
  nissan: 2,
  chevrolet: 2,
  ford: 2,
  gmc: 2,
  buick: 2,
  volkswagen: 3,
  audi: 3,
  bmw: 3,
  "mercedes-benz": 3,
  mercedes: 3,
  jaguar: 3,
  "land rover": 3,
  "land-rover": 3,
  jeep: 3,
  ram: 3,
  dodge: 3,
  chrysler: 3,
  volvo: 3,
  porsche: 3,
  fiat: 3,
  alfa: 3,
};
// PLACEHOLDER — assume average reliability when brand is unknown.
const DEFAULT_RELIABILITY_TIER: 1 | 2 | 3 = 2;

/**
 * Base fair-price band for a "typical" extended warranty/VSC, expressed as a
 * dollar range BEFORE adjusting for vehicle risk, coverage tier, and term.
 * ASSUMPTION: a mainstream VSC on an average used car commonly lands roughly
 * in the low-four-figures; we anchor a wide band and adjust. This is a
 * transparent placeholder, not a quoted price.
 */
// PLACEHOLDER — replace with real engine value (owner's warranty pricing engine)
const WARRANTY_BASE_RANGE = { low: 900, high: 1800 };

/** Coverage tier multipliers applied to the base range. ASSUMPTION-based. */
// PLACEHOLDER — replace with real engine value
const COVERAGE_TIER_MULTIPLIER: Record<WarrantyCoverageTier, number> = {
  powertrain: 0.7, // narrowest coverage → cheapest fair price
  named_component: 0.9,
  stated_component: 1.0,
  exclusionary: 1.35, // broadest ("bumper-to-bumper") → highest fair price
  unknown: 1.0,
};

/** Reliability tier multipliers. Riskier brands justify a higher fair price. */
// PLACEHOLDER — replace with real engine value
const RELIABILITY_MULTIPLIER: Record<1 | 2 | 3, number> = {
  1: 0.85,
  2: 1.0,
  3: 1.3,
};

/**
 * Age & mileage risk surcharge. Older / higher-mileage cars are more likely to
 * need repairs, so a higher fair price is justified — up to a cap.
 * ASSUMPTION: +4% fair price per year of age over 3, +3% per 15k miles over
 * 45k, capped so the placeholder never runs away.
 */
// PLACEHOLDER — replace with real engine value
const AGE_FREE_YEARS = 3;
const AGE_SURCHARGE_PER_YEAR = 0.04;
const MILEAGE_FREE = 45_000;
const MILEAGE_SURCHARGE_PER_15K = 0.03;
const RISK_SURCHARGE_CAP = 0.6; // never more than +60%

/**
 * Term multiplier — longer contracts (more months/miles) cost more to cover.
 * ASSUMPTION: a 36-month contract is the baseline (1.0x).
 */
// PLACEHOLDER — replace with real engine value
const TERM_BASELINE_MONTHS = 36;
const TERM_SURCHARGE_PER_12_MONTHS = 0.12;

/**
 * How far above the fair range we tolerate before escalating the rating.
 * ASSUMPTION-based thresholds, expressed as a ratio of quoted price to the TOP
 * of the fair range.
 */
// PLACEHOLDER — replace with real engine value
const WARRANTY_HIGH_THRESHOLD = 1.15; // >15% over fair top → "high"
const WARRANTY_VERY_OVERPRICED_THRESHOLD = 1.6; // >60% over → "very_overpriced"

/**
 * Likely qualifying APR by credit band — used ONLY to flag dealer markup.
 * These are wide assumption bands, not a rate quote. The dealer commonly marks
 * up the buy-rate; if the offered APR sits well above the band, we flag it.
 * ASSUMPTION: reflects a generic used-car financing environment.
 */
// PLACEHOLDER — replace with real engine value (owner's rate model / live data)
const LIKELY_APR_BAND: Record<CreditBand, { low: number; high: number }> = {
  excellent: { low: 4.5, high: 7.5 },
  good: { low: 6.5, high: 10.5 },
  fair: { low: 9.5, high: 15.0 },
  poor: { low: 14.0, high: 21.0 },
  unknown: { low: 5.0, high: 18.0 }, // very wide → low confidence
};
/** Flag APR markup only when offered rate exceeds band top by this margin. */
// PLACEHOLDER — replace with real engine value
const APR_MARKUP_MARGIN_PCT = 2.0;

/**
 * Monthly-payment "reality check" — detects payment packing, the F&I trick of
 * burying add-ons, gap insurance, or rate markup inside a monthly number the
 * buyer fixates on. We recover the principal the quoted payment actually
 * supports (at the stated APR + term) and compare it to what the buyer told us
 * they're financing.
 *
 * A buyer rarely itemizes sales tax / title, which ARE legitimately financed —
 * so we extend an allowance (a generous % of the price) before calling any
 * surplus "unexplained." Only padding ABOVE that cushion is flagged, which
 * keeps honest tax-heavy deals from tripping a false alarm.
 */
// PLACEHOLDER — replace with real engine value
const TAX_TITLE_ALLOWANCE_PCT = 0.1; // assume up to ~10% of price may be tax/title
// Padding must clear BOTH an absolute floor and a share of the price to flag.
const PACKING_MIN_ABS = 1_200;
const PACKING_MIN_PCT_OF_PRICE = 0.05;

/**
 * Trade-in lowball detection. A dealer's trade offer legitimately runs somewhat
 * below clean retail (they recondition and resell at a margin), so we only flag
 * a gap that clears BOTH a percentage and an absolute floor below the buyer's
 * OWN researched value. We never price the trade ourselves — no false precision.
 */
// PLACEHOLDER — replace with real engine value (owner's trade valuation model)
const TRADE_LOWBALL_MIN_PCT = 0.1; // offer >10% under the buyer's value, and…
const TRADE_LOWBALL_MIN_ABS = 500; // …at least $500 under, before we flag.

/**
 * Junk/padded-fee detection. Legitimate fees exist (real doc, title, registry),
 * but several line items are pure profit padding or have a typical reasonable
 * ceiling. We match fee labels heuristically.
 *
 * `reasonableMax` = an ASSUMPTION for a defensible ceiling; amounts above it are
 * flagged as likely padded. `alwaysJunk` items have little/no buyer value.
 */
// PLACEHOLDER — replace with real engine value
interface FeeRule {
  keywords: string[];
  /** A defensible ceiling for a legitimate version of this fee, if any. */
  reasonableMax?: number;
  /** True when the item is widely considered pure padding / negligible value. */
  alwaysJunk?: boolean;
  label: string;
  why: string;
}

// PLACEHOLDER — replace with real engine value (owner's fee research)
const FEE_RULES: FeeRule[] = [
  {
    keywords: ["doc", "documentation", "documentary"],
    reasonableMax: 200, // ASSUMPTION: many states cap or expect ~$75–$200
    label: "Documentation fee",
    why: "Doc fees cover paperwork the dealer already has to do. A modest fee can be legitimate, but unusually high doc fees are often pure profit and are sometimes capped by state law.",
  },
  {
    keywords: ["dealer prep", "prep", "preparation"],
    alwaysJunk: true,
    label: "Dealer prep fee",
    why: "Getting the car ready to sell is a normal cost of doing business. A separate 'prep' charge is widely considered padding.",
  },
  {
    keywords: ["nitrogen"],
    alwaysJunk: true,
    label: "Nitrogen tire fill",
    why: "Nitrogen in tires offers little real benefit for everyday drivers. This is a classic high-margin add-on you can decline.",
  },
  {
    keywords: ["paint", "fabric", "protection package", "protection pkg", "sealant"],
    alwaysJunk: true,
    label: "Paint / fabric protection",
    why: "Dealer-applied paint or fabric protection is typically marked up heavily versus a consumer product, and is rarely necessary. Usually negotiable or removable.",
  },
  {
    keywords: ["vin etch", "etch", "anti-theft etch", "theft etch"],
    alwaysJunk: true,
    label: "VIN etching",
    why: "VIN etching is cheap to do yourself or through insurance. Dealer-charged etching is often marked up several times over.",
  },
  {
    keywords: ["market adjustment", "market adj", "addendum", "adp", "additional dealer"],
    alwaysJunk: true,
    label: "Market adjustment / addendum",
    why: "A 'market adjustment' is simply the dealer charging over sticker. It reflects no added value and is negotiable.",
  },
  {
    keywords: ["procurement", "acquisition", "appearance"],
    alwaysJunk: true,
    label: "Procurement / appearance fee",
    why: "Vague fees like this rarely correspond to a real service and are commonly used to pad the bottom line.",
  },
  {
    keywords: ["title", "registration", "registry", "license", "plate"],
    reasonableMax: 600, // ASSUMPTION: government fees vary widely by state
    label: "Title / registration",
    why: "These are government fees the dealer passes through. They're usually legitimate, but confirm the amount matches your state's actual charges.",
  },
];

// ===========================================================================
//  CORE SCORING — the single public interface
// ===========================================================================

/**
 * Score a deal and return a buyer-facing verdict. This is the ONLY function
 * the rest of the app calls. Swap its internals for the real engine while
 * keeping this signature and the exported types stable.
 */
export function scoreDeal(input: FairnessInput): FairnessResult {
  const assumptions: string[] = [];
  const flags: Flag[] = [];

  // --- Warranty assessment (optional) ------------------------------------
  let warranty: WarrantyAssessment | null = null;
  if (input.warranty && hasAnyWarrantySignal(input.warranty)) {
    warranty = assessWarranty(input.vehicle, input.warranty, assumptions);
    const warrantyFlag = warrantyToFlag(warranty);
    if (warrantyFlag) flags.push(warrantyFlag);
  }

  // --- APR markup --------------------------------------------------------
  const aprFlag = assessApr(input.deal, assumptions);
  if (aprFlag) flags.push(aprFlag);

  // --- Monthly-payment reality check (payment packing) -------------------
  const paymentFlag = assessPayment(input.deal, input.warranty ?? null, assumptions);
  if (paymentFlag) flags.push(paymentFlag);

  // --- Trade-in (lowball + negative equity) ------------------------------
  if (input.tradeIn && hasTradeSignal(input.tradeIn)) {
    flags.push(...assessTradeIn(input.tradeIn, assumptions));
  }

  // --- Fees & add-ons ----------------------------------------------------
  flags.push(...assessFees(input.deal.fees ?? [], assumptions));

  // --- Missing-info honesty notes ---------------------------------------
  flags.push(...missingInfoNotes(input));

  // --- Roll everything up into an overall verdict + confidence -----------
  const { overallVerdict, headline, confidence } = rollUp(flags, warranty, input);

  return {
    overallVerdict,
    headline,
    confidence,
    flags,
    warranty,
    assumptions: dedupe(assumptions),
    engineVersion: ENGINE_VERSION,
  };
}

// ---------------------------------------------------------------------------
//  Warranty pricing
// ---------------------------------------------------------------------------

function hasAnyWarrantySignal(w: WarrantyInput): boolean {
  return Boolean(
    w.priceQuoted ||
      w.coverageTier ||
      w.termMonths ||
      w.termMiles ||
      w.provider,
  );
}

function reliabilityTier(make: string): 1 | 2 | 3 {
  const key = make.trim().toLowerCase();
  return BRAND_RELIABILITY_TIER[key] ?? DEFAULT_RELIABILITY_TIER;
}

function assessWarranty(
  vehicle: VehicleInput,
  w: WarrantyInput,
  assumptions: string[],
): WarrantyAssessment {
  const tier = reliabilityTier(vehicle.make);
  const coverage = w.coverageTier ?? "unknown";

  // Start from the base assumption band and apply documented multipliers.
  let low = WARRANTY_BASE_RANGE.low;
  let high = WARRANTY_BASE_RANGE.high;

  const covMult = COVERAGE_TIER_MULTIPLIER[coverage];
  const relMult = RELIABILITY_MULTIPLIER[tier];

  // Age & mileage risk surcharge (relative to current calendar year).
  const now = new Date().getFullYear();
  const age = Math.max(0, now - (vehicle.year || now));
  const ageSurcharge =
    Math.max(0, age - AGE_FREE_YEARS) * AGE_SURCHARGE_PER_YEAR;
  const miles = vehicle.mileage ?? 0;
  const mileageSurcharge =
    (Math.max(0, miles - MILEAGE_FREE) / 15_000) * MILEAGE_SURCHARGE_PER_15K;
  const riskSurcharge = Math.min(
    RISK_SURCHARGE_CAP,
    ageSurcharge + mileageSurcharge,
  );

  // Term surcharge relative to the baseline contract length.
  const term = w.termMonths ?? TERM_BASELINE_MONTHS;
  const termSurcharge =
    ((term - TERM_BASELINE_MONTHS) / 12) * TERM_SURCHARGE_PER_12_MONTHS;

  const totalMult =
    covMult * relMult * (1 + riskSurcharge) * (1 + Math.max(-0.3, termSurcharge));

  low = Math.round((low * totalMult) / 25) * 25;
  high = Math.round((high * totalMult) / 25) * 25;

  // Confidence: thin inputs → low confidence and a wider honest range.
  const knownSignals = [
    w.coverageTier,
    w.termMonths,
    vehicle.mileage,
    vehicle.year,
  ].filter((v) => v !== null && v !== undefined).length;
  let confidence: Confidence = "low";
  if (knownSignals >= 3) confidence = "medium";
  if (knownSignals === 4 && w.coverageTier && w.coverageTier !== "unknown") {
    confidence = "high";
  }
  // When confidence is low, widen the band so we never imply false precision.
  if (confidence === "low") {
    low = Math.round((low * 0.85) / 25) * 25;
    high = Math.round((high * 1.2) / 25) * 25;
  }

  assumptions.push(
    `Warranty fair-price range is an estimate from documented assumption ranges (brand reliability tier ${tier}, coverage "${coverage}", ${age} yr / ${miles.toLocaleString()} mi, ${term}-mo term) — exact prices vary by provider and negotiation.`,
  );

  const fairRange: PriceRange = {
    low,
    high,
    confidence,
    basis:
      "Estimated from vehicle age/mileage, brand reliability, coverage tier, and term using transparent assumption ranges. Not an exact quote — warranty prices are negotiable and vary by provider.",
  };

  const quoted = w.priceQuoted ?? null;
  const { rating, explanation } = rateWarrantyPrice(quoted, fairRange);

  return { rating, fairRange, quotedPrice: quoted, explanation };
}

function rateWarrantyPrice(
  quoted: number | null,
  fair: PriceRange,
): { rating: WarrantyPriceRating; explanation: string } {
  if (quoted === null) {
    return {
      rating: "negotiable",
      explanation:
        "You didn't enter a warranty price, so we can't compare it. Whatever the dealer quotes, treat it as negotiable — these contracts carry large markups and the price is rarely fixed.",
    };
  }
  if (quoted <= fair.high) {
    if (quoted < fair.low) {
      return {
        rating: "fair",
        explanation:
          "The quoted price is at or below our estimated fair range. That's a good sign — still confirm exactly what's covered and the deductible.",
      };
    }
    return {
      rating: "fair",
      explanation:
        "The quoted price sits within our estimated fair range. It looks reasonable, but the price is still negotiable and worth a counter-offer.",
    };
  }
  const ratio = quoted / fair.high;
  if (ratio > WARRANTY_VERY_OVERPRICED_THRESHOLD) {
    return {
      rating: "very_overpriced",
      explanation:
        "The quoted price is far above our estimated fair range. Extended warranties carry some of the largest markups in the finance office — there is usually a lot of room to negotiate, or to buy a comparable contract elsewhere for much less.",
    };
  }
  if (ratio > WARRANTY_HIGH_THRESHOLD) {
    return {
      rating: "high",
      explanation:
        "The quoted price is above our estimated fair range. Consider countering toward the fair range, or shopping the same coverage from another provider before agreeing.",
    };
  }
  return {
    rating: "negotiable",
    explanation:
      "The quoted price is a little above our estimated fair range. It's close, but still worth a counter-offer — the price is rarely fixed.",
  };
}

function warrantyToFlag(w: WarrantyAssessment): Flag | null {
  if (w.rating === "fair") return null;
  if (w.quotedPrice === null) return null;
  const overTop = Math.max(0, w.quotedPrice - w.fairRange.high);
  const severity: FlagSeverity =
    w.rating === "very_overpriced" ? "high" : w.rating === "high" ? "medium" : "low";
  return {
    type: "overpriced_warranty",
    severity,
    title:
      w.rating === "very_overpriced"
        ? "Extended warranty looks very overpriced"
        : w.rating === "high"
          ? "Extended warranty looks overpriced"
          : "Extended warranty price is negotiable",
    explanation: w.explanation,
    estimatedImpact:
      overTop > 0
        ? {
            low: Math.round((overTop * 0.5) / 25) * 25,
            high: Math.round(overTop / 25) * 25,
            confidence: w.fairRange.confidence,
            basis:
              "Rough estimate of how much you may be over the fair range — actual savings depend on negotiation.",
          }
        : null,
  };
}

// ---------------------------------------------------------------------------
//  APR markup
// ---------------------------------------------------------------------------

function assessApr(deal: DealInput, assumptions: string[]): Flag | null {
  if (deal.apr === null || deal.apr === undefined) return null;
  const band = LIKELY_APR_BAND[deal.creditBand ?? "unknown"];
  assumptions.push(
    `Likely qualifying APR band for "${deal.creditBand ?? "unknown"}" credit is assumed to be ${band.low}%–${band.high}% — a wide placeholder, not a rate quote.`,
  );
  const threshold = band.high + APR_MARKUP_MARGIN_PCT;
  if (deal.apr <= threshold) return null;

  const over = deal.apr - band.high;
  // Rough lifetime interest impact estimate — clearly a range, low precision.
  const principal =
    (deal.vehiclePrice ?? 0) - (deal.downPayment ?? 0) > 0
      ? (deal.vehiclePrice ?? 0) - (deal.downPayment ?? 0)
      : null;
  const term = deal.termMonths ?? 60;
  let impact: PriceRange | null = null;
  if (principal && principal > 0) {
    // Approximate extra interest = principal * (extraRate) * (term/12) * 0.5
    // (the 0.5 roughly accounts for the declining balance). Deliberately loose.
    const extraLow = principal * ((over / 100) * (term / 12)) * 0.4;
    const extraHigh = principal * (((over + 2) / 100) * (term / 12)) * 0.6;
    impact = {
      low: Math.round(extraLow / 25) * 25,
      high: Math.round(extraHigh / 25) * 25,
      confidence: deal.creditBand && deal.creditBand !== "unknown" ? "medium" : "low",
      basis:
        "Rough estimate of extra interest over the loan vs. a likely qualifying rate. Depends heavily on your actual credit and the lender.",
    };
  }

  return {
    type: "apr_markup",
    severity: over > 4 ? "high" : "medium",
    title: "Possible marked-up interest rate",
    explanation: `The ${deal.apr}% APR offered is above the ${band.low}%–${band.high}% range a buyer with your stated credit would likely qualify for. Dealers often mark up the lender's rate and keep the difference. Ask to see the "buy rate," or get a pre-approval from your own bank or credit union to compare.`,
    estimatedImpact: impact,
  };
}

// ---------------------------------------------------------------------------
//  Monthly-payment reality check (payment packing)
// ---------------------------------------------------------------------------

/** Dollars the buyer has explicitly told us are part of the financed deal. */
function knownFinanced(deal: DealInput, warranty: WarrantyInput | null): number {
  const price = deal.vehiclePrice ?? 0;
  const down = deal.downPayment ?? 0;
  const feeTotal = (deal.fees ?? []).reduce((sum, f) => sum + (f.amount || 0), 0);
  const warrantyPrice = warranty?.priceQuoted ?? 0;
  return Math.max(0, price - down) + feeTotal + warrantyPrice;
}

/**
 * Cross-check the quoted monthly payment against the rest of the deal. Two
 * complementary reads, depending on whether the buyer knows their APR:
 *
 *  1. APR known  → recover the principal the payment really supports and flag
 *     when it exceeds price − down + fees + warranty + a tax/title cushion.
 *     That surplus is money being financed that the buyer never accounted for.
 *  2. APR unknown → recover the APR the payment implies (treating the known
 *     financed amount, plus the same cushion, as principal) and flag when it
 *     lands well above the buyer's likely qualifying band.
 *
 * Needs a payment, a term, and a vehicle price to say anything; otherwise it
 * stays silent (no false precision).
 */
function assessPayment(
  deal: DealInput,
  warranty: WarrantyInput | null,
  assumptions: string[],
): Flag | null {
  const payment = deal.monthlyPayment ?? null;
  const term = deal.termMonths ?? null;
  const price = deal.vehiclePrice ?? null;
  if (!payment || payment <= 0) return null;
  if (!term || term <= 0) return null;
  if (!price || price <= 0) return null;

  const known = knownFinanced(deal, warranty);
  // Cushion for taxes/registration a buyer rarely itemizes but legitimately
  // finances. Surplus is only "unexplained" once it clears this.
  const cushion = price * TAX_TITLE_ALLOWANCE_PCT;

  // --- Path 1: APR known → look for an unexplained financed balance --------
  if (deal.apr !== null && deal.apr !== undefined) {
    const impliedPrincipal = principalFromPayment(payment, deal.apr, term);
    const unexplained = impliedPrincipal - known - cushion;
    const floor = Math.max(PACKING_MIN_ABS, price * PACKING_MIN_PCT_OF_PRICE);
    if (unexplained <= floor) return null;

    assumptions.push(
      `Monthly-payment check assumes up to ~${Math.round(
        TAX_TITLE_ALLOWANCE_PCT * 100,
      )}% of the price (~${money(cushion)}) could be legitimate taxes/registration you didn't itemize — only financing beyond that is treated as unexplained.`,
    );

    return {
      type: "payment_packing",
      severity: unexplained >= 3_500 ? "high" : "medium",
      title: "Monthly payment is higher than the numbers add up to",
      explanation: `At the ${deal.apr}% APR and ${term}-month term you entered, a payment of ${money(
        payment,
      )} only makes sense if about ${money(
        impliedPrincipal,
      )} is being financed — roughly ${money(
        Math.round(unexplained),
      )} more than the price, fees, and warranty you listed (even after allowing for taxes). That gap is often packed-in add-ons, gap insurance, or a higher balance than you agreed to. Ask for the "amount financed" line and an itemized breakdown before you sign.`,
      estimatedImpact: {
        low: Math.round((unexplained * 0.4) / 25) * 25,
        high: Math.round(unexplained / 25) * 25,
        confidence: "medium",
        basis:
          "Estimated balance financed beyond the price, down payment, fees, and warranty you entered (after a tax/title allowance). Some may be legitimate items you didn't list — confirm against the amount financed.",
      },
    };
  }

  // --- Path 2: APR unknown → infer the rate the payment implies ------------
  // Use the generous principal (known + cushion) so we only flag a rate that is
  // high even after crediting every dollar that could legitimately be financed.
  const assumedPrincipal = known + cushion;
  if (assumedPrincipal <= 0) return null;
  const apr = impliedAprPct(payment, assumedPrincipal, term);
  if (apr === null || apr === 0) return null;

  const band = LIKELY_APR_BAND[deal.creditBand ?? "unknown"];
  const threshold = band.high + APR_MARKUP_MARGIN_PCT;
  if (apr <= threshold) return null;

  assumptions.push(
    `With no APR entered, the interest rate was estimated from your payment, term, and the amounts you listed (plus a tax/title allowance) — about ${apr.toFixed(
      1,
    )}%. This is a rough inference, not a rate quote.`,
  );

  return {
    type: "payment_packing",
    severity: apr - band.high > 6 ? "high" : "medium",
    title: "Your payment implies a high interest rate",
    explanation: `You didn't enter an APR, but a ${money(
      payment,
    )} payment over ${term} months on what you've listed works out to roughly ${apr.toFixed(
      1,
    )}% — above the ${band.low}%–${band.high}% a buyer with your stated credit would likely qualify for. The rate may be marked up, or more may be financed than you realize. Ask for the APR and the amount financed in writing, and compare a pre-approval from your own bank or credit union.`,
    estimatedImpact: null,
  };
}

// ---------------------------------------------------------------------------
//  Trade-in: lowball offer + negative equity
// ---------------------------------------------------------------------------

function hasTradeSignal(t: TradeInInput): boolean {
  return Boolean(t.offer || t.estimatedValue || t.loanPayoff);
}

const round25 = (n: number): number => Math.round(n / 25) * 25;

/**
 * Two independent trade-in checks:
 *  - LOWBALL needs the buyer's own researched value; we flag an offer that sits
 *    well below it (beyond normal dealer margin).
 *  - NEGATIVE EQUITY needs only the loan payoff vs. the offer; owing more than
 *    the trade is worth is a serious trap when it's rolled into the new loan.
 * When a trade is present but no value was entered, we add a buyer-side nudge
 * to look it up (type "info" — never affects the verdict or confidence).
 */
function assessTradeIn(t: TradeInInput, assumptions: string[]): Flag[] {
  const flags: Flag[] = [];
  const offer = t.offer ?? null;
  const value = t.estimatedValue ?? null;
  const payoff = t.loanPayoff ?? null;

  // --- Lowball: dealer offer vs. the buyer's researched value -------------
  if (offer != null && value != null && value > 0) {
    const gap = value - offer;
    const floor = Math.max(TRADE_LOWBALL_MIN_ABS, value * TRADE_LOWBALL_MIN_PCT);
    if (gap > floor) {
      assumptions.push(
        "Trade-in lowball check compares the dealer's offer to the value you entered; real trade offers run somewhat below clean retail for reconditioning and resale margin.",
      );
      flags.push({
        type: "trade_lowball",
        severity: gap >= 2_000 ? "high" : "medium",
        title: "Trade-in offer looks low",
        explanation: `The dealer offered ${money(offer)} for your trade, but you valued it around ${money(
          value,
        )} — about ${money(
          gap,
        )} less. Some gap is normal (the dealer resells at a margin), but this is wide enough to push on. Get a couple of competing offers (e.g. CarMax, Carvana) to use as leverage, or sell it yourself.`,
        estimatedImpact: {
          low: round25(gap * 0.4),
          high: round25(gap),
          confidence: "low",
          basis:
            "Estimated room between the offer and the value you entered — depends on your car's real condition and local demand.",
        },
      });
    }
  } else if (offer != null && offer > 0 && (value == null || value <= 0)) {
    // Have an offer but nothing to compare it to — nudge, don't score.
    flags.push({
      type: "info",
      severity: "info",
      title: "Look up your trade's value",
      explanation:
        "You entered a trade-in offer but no value to compare it against. Look up your car's trade-in value (KBB, Edmunds) or get a quick quote from CarMax/Carvana, then re-check — that's how you'll know if the offer is fair.",
    });
  }

  // --- Negative equity: owe more than the trade is worth ------------------
  if (offer != null && payoff != null && payoff > offer) {
    const neg = payoff - offer;
    flags.push({
      type: "negative_equity",
      severity: neg >= 3_000 ? "high" : "medium",
      title: "You owe more on your trade than it's worth",
      explanation: `Your loan payoff (${money(
        payoff,
      )}) is about ${money(
        neg,
      )} more than the ${money(
        offer,
      )} the dealer is offering. That ${money(
        neg,
      )} of "negative equity" usually gets rolled into your new loan — so you'd finance part of a car you no longer own, often at the new car's rate. Ask exactly how the payoff is handled, and avoid rolling it in if you can.`,
      estimatedImpact: {
        low: round25(neg),
        high: round25(neg * 1.2),
        confidence: "medium",
        basis:
          "The negative equity that may be added to your new loan — the high end allows for interest if it's financed.",
      },
    });
  }

  return flags;
}

// ---------------------------------------------------------------------------
//  Fees & add-ons
// ---------------------------------------------------------------------------

export interface FeeAuditResult {
  /** One flag per fee we'd challenge — junk items and padded amounts. */
  flags: Flag[];
  /** Transparency notes about the ceilings/assumptions we applied. */
  assumptions: string[];
  /** How many of the entered fees we'd push back on. */
  challengeCount: number;
  /** Estimated dollars on the table if every flag is challenged. A range. */
  estimatedSavings: { low: number; high: number } | null;
}

/**
 * Focused public entry point for the standalone Junk Fee Audit tool. Runs the
 * EXACT same fee logic {@link scoreDeal} uses, on a fee list alone, so the free
 * audit and the full Deal Check can never drift apart. No vehicle, APR, or
 * warranty needed — just the line items.
 */
export function auditFees(fees: ItemizedFee[]): FeeAuditResult {
  const assumptions: string[] = [];
  const flags = assessFees(fees, assumptions);
  let low = 0;
  let high = 0;
  let any = false;
  for (const f of flags) {
    if (f.estimatedImpact) {
      low += f.estimatedImpact.low;
      high += f.estimatedImpact.high;
      any = true;
    }
  }
  return {
    flags,
    assumptions: dedupe(assumptions),
    challengeCount: flags.length,
    estimatedSavings: any && high > 0 ? { low, high } : null,
  };
}

function assessFees(fees: ItemizedFee[], assumptions: string[]): Flag[] {
  const out: Flag[] = [];
  for (const fee of fees) {
    if (!fee.label) continue;
    const label = fee.label.toLowerCase();
    const rule = FEE_RULES.find((r) =>
      r.keywords.some((k) => label.includes(k)),
    );
    if (!rule) continue;

    if (rule.alwaysJunk) {
      out.push({
        type: rule.label.includes("protection") || rule.label.includes("Nitrogen")
          ? "overpriced_addon"
          : "junk_fee",
        severity: fee.amount >= 500 ? "high" : "medium",
        title: `Likely junk fee: ${rule.label}`,
        explanation: `${rule.why} You were charged $${fee.amount.toLocaleString()} for "${fee.label}". This is typically negotiable or removable — ask for it to be taken off.`,
        estimatedImpact: {
          low: Math.round((fee.amount * 0.6) / 25) * 25,
          high: fee.amount,
          confidence: "medium",
          basis: "Potential savings if removed or declined — usually negotiable.",
        },
      });
    } else if (rule.reasonableMax && fee.amount > rule.reasonableMax) {
      const over = fee.amount - rule.reasonableMax;
      assumptions.push(
        `Assumed a reasonable ceiling of ~$${rule.reasonableMax} for "${rule.label}" — actual norms vary by state.`,
      );
      out.push({
        type: "junk_fee",
        severity: over >= 400 ? "high" : "medium",
        title: `${rule.label} looks high`,
        explanation: `${rule.why} You were charged $${fee.amount.toLocaleString()}, which is above a typical ceiling of about $${rule.reasonableMax.toLocaleString()}. Ask the dealer to justify or reduce it.`,
        estimatedImpact: {
          low: Math.round((over * 0.5) / 25) * 25,
          high: over,
          confidence: "low",
          basis:
            "Estimated amount above a typical ceiling — norms vary by state and dealer.",
        },
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
//  Missing-info honesty notes — never imply we scored data we didn't have.
// ---------------------------------------------------------------------------

function missingInfoNotes(input: FairnessInput): Flag[] {
  const notes: Flag[] = [];
  const d = input.deal;
  if (d.apr === null || d.apr === undefined) {
    notes.push({
      type: "missing_info",
      severity: "info",
      title: "No APR entered",
      explanation:
        "We couldn't check for interest-rate markup because no APR was provided. If you're financing, add the APR for a more complete check.",
    });
  }
  if (!d.fees || d.fees.length === 0) {
    notes.push({
      type: "missing_info",
      severity: "info",
      title: "No itemized fees entered",
      explanation:
        "We couldn't scan for junk fees because none were itemized. Ask the dealer for a line-by-line breakdown of all fees and add-ons, then re-check.",
    });
  }
  return notes;
}

// ---------------------------------------------------------------------------
//  Roll-up — combine signals into one verdict + honest confidence.
// ---------------------------------------------------------------------------

function rollUp(
  flags: Flag[],
  warranty: WarrantyAssessment | null,
  input: FairnessInput,
): { overallVerdict: Verdict; headline: string; confidence: Confidence } {
  const realFlags = flags.filter((f) => f.type !== "missing_info" && f.type !== "info");
  const highCount = realFlags.filter((f) => f.severity === "high").length;
  const mediumCount = realFlags.filter((f) => f.severity === "medium").length;

  let overallVerdict: Verdict = "green";
  if (highCount >= 1 || mediumCount >= 2) {
    overallVerdict = "red";
  } else if (mediumCount === 1 || realFlags.some((f) => f.severity === "low")) {
    overallVerdict = "amber";
  }

  // Confidence reflects how much real data we had to work with.
  const infoCount = flags.filter((f) => f.type === "missing_info").length;
  let confidence: Confidence = "high";
  if (infoCount >= 2) confidence = "low";
  else if (infoCount === 1) confidence = "medium";
  if (warranty && warranty.fairRange.confidence === "low" && confidence === "high") {
    confidence = "medium";
  }

  let headline: string;
  if (overallVerdict === "red") {
    headline =
      "This deal has problems worth pushing back on before you sign.";
  } else if (overallVerdict === "amber") {
    headline =
      "This deal is mostly okay, but a few things are worth questioning.";
  } else {
    headline =
      realFlags.length === 0
        ? "Nothing jumped out as a red flag in what you entered."
        : "This deal looks reasonable overall.";
  }

  return { overallVerdict, headline, confidence };
}

// ---------------------------------------------------------------------------
//  Small utilities
// ---------------------------------------------------------------------------

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

/** Whole-dollar currency formatting for buyer-facing explanation copy. */
function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * Action-oriented verdict labels. The automated scan returns green/amber/red;
 * "black" (walk away — fraud or legal concern) is a human-reviewer escalation
 * only, assigned from the console — fraud needs human judgment, not a heuristic.
 */
export const VERDICT_LABEL: Record<Verdict, string> = {
  green: "Looks fair",
  amber: "Negotiate first",
  red: "Don't sign yet",
  black: "Walk away",
};

export const WARRANTY_RATING_LABEL: Record<WarrantyPriceRating, string> = {
  fair: "Fair price",
  high: "Overpriced",
  very_overpriced: "Very overpriced",
  negotiable: "Negotiable",
};
