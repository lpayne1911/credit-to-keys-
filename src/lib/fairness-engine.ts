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

export interface FairnessInput {
  vehicle: VehicleInput;
  deal: DealInput;
  /** Optional — many buyers check a deal with no warranty attached. */
  warranty?: WarrantyInput | null;
}

// ---------------------------------------------------------------------------
//  OUTPUT TYPES
// ---------------------------------------------------------------------------

export type Verdict = "green" | "amber" | "red";

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
//  Fees & add-ons
// ---------------------------------------------------------------------------

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

/** Human-readable labels for verdict/rating enums, for UI reuse. */
export const VERDICT_LABEL: Record<Verdict, string> = {
  green: "Looks fair",
  amber: "Proceed with caution",
  red: "This deal has problems",
};

export const WARRANTY_RATING_LABEL: Record<WarrantyPriceRating, string> = {
  fair: "Fair price",
  high: "Overpriced",
  very_overpriced: "Very overpriced",
  negotiable: "Negotiable",
};
