/**
 * Deal-score categories — a PRESENTATION-ONLY derivation that turns the engine's
 * flat flag list (plus the fee-risk channel) into five at-a-glance categories:
 * Price fairness, Payment fairness, Fee risk, Add-on risk, and Tax/title/
 * registration. It does NOT change the verdict or score — it summarizes what's
 * already there so a stressed buyer can read the deal at a glance.
 *
 * Kept out of the fairness engine (like `dealScore` in VerdictView) so the
 * engine's tests stay stable. Pure + deterministic.
 *
 * COMPLIANCE: notes are buyer-side consumer guidance ("based on what you
 * entered", "ask the dealer…") — never legal advice, never "illegal/guaranteed".
 * Empty categories read "no red flags in what you entered," not "this is fair."
 */
import type { FairnessResult, Flag, FlagType } from "./fairness-engine";
import type { FeeRiskAssessment, FeeCategory } from "./fee-classifier";

export type CategoryKey = "price" | "payment" | "fees" | "addons" | "tax_title_reg";

export type CategoryLevel = "looks_clear" | "worth_a_look" | "high_risk" | "needs_info";

export interface DealCategory {
  key: CategoryKey;
  label: string;
  level: CategoryLevel;
  /** One-line, plain-English, compliance-safe summary. */
  note: string;
  /** How many contributing signals fed this category. */
  flagCount: number;
}

/** Which category each verdict-affecting flag type rolls up into. */
const CATEGORY_OF_FLAG: Partial<Record<FlagType, CategoryKey>> = {
  trade_lowball: "price",
  negative_equity: "price",
  apr_markup: "payment",
  payment_packing: "payment",
  junk_fee: "fees",
  overpriced_addon: "addons",
  overpriced_warranty: "addons",
  // missing_info / info / redundant_addon don't elevate a category.
};

const ORDER: { key: CategoryKey; label: string }[] = [
  { key: "price", label: "Price fairness" },
  { key: "payment", label: "Payment fairness" },
  { key: "fees", label: "Fee risk" },
  { key: "addons", label: "Add-on risk" },
  { key: "tax_title_reg", label: "Tax, title & registration" },
];

const GOVERNMENT_FEE_CATEGORIES: FeeCategory[] = [
  "government_fee",
  "tax",
  "title",
  "registration",
];

const NOTES: Record<CategoryKey, Record<CategoryLevel, string>> = {
  price: {
    looks_clear: "No price or trade-in red flags in what you entered.",
    worth_a_look: "A trade-in or equity detail here is worth a closer look.",
    high_risk: "A low trade offer or negative equity is dragging this deal.",
    needs_info: "Add the price and trade details so we can check this.",
  },
  payment: {
    looks_clear: "No rate or payment red flags in what you entered.",
    worth_a_look: "The rate, term, or payment is worth questioning.",
    high_risk: "Your rate or monthly payment looks marked up.",
    needs_info: "Add your APR and term so we can check the financing.",
  },
  fees: {
    looks_clear: "No padded or out-of-range fees in what you entered.",
    worth_a_look: "Some fees look dealer-created — worth questioning.",
    high_risk: "One or more fees look padded or above your state's known cap.",
    needs_info: "Add the itemized fees so we can check them.",
  },
  addons: {
    looks_clear: "No overpriced add-ons or warranty in what you entered.",
    worth_a_look: "An add-on or warranty here is worth a second look.",
    high_risk: "An add-on or warranty looks overpriced — push back.",
    needs_info: "Add the add-ons and warranty price so we can check them.",
  },
  tax_title_reg: {
    looks_clear: "Government fees appear itemized — confirm the out-the-door total.",
    worth_a_look: "Confirm the tax, title, and registration lines in writing.",
    high_risk: "A tax, title, or registration line looks off — ask the dealer to itemize it.",
    needs_info:
      "Ask for the itemized out-the-door price so tax, title, and registration are separate.",
  },
};

function severityRank(s: Flag["severity"]): number {
  return s === "high" ? 3 : s === "medium" ? 2 : s === "low" ? 1 : 0;
}

function levelFromRank(rank: number): CategoryLevel {
  if (rank >= 3) return "high_risk";
  if (rank >= 1) return "worth_a_look";
  return "looks_clear";
}

/**
 * Derive the five buyer-facing categories from the engine result and the
 * (optional) state-aware fee-risk assessment. Always returns 5 entries in a
 * fixed order.
 */
export function categorizeDeal(
  result: FairnessResult,
  feeRisk?: FeeRiskAssessment | null,
): DealCategory[] {
  const worst: Record<CategoryKey, number> = {
    price: 0,
    payment: 0,
    fees: 0,
    addons: 0,
    tax_title_reg: 0,
  };
  const counts: Record<CategoryKey, number> = {
    price: 0,
    payment: 0,
    fees: 0,
    addons: 0,
    tax_title_reg: 0,
  };

  // Engine flags → categories (info-severity flags don't elevate).
  for (const f of result.flags) {
    const cat = CATEGORY_OF_FLAG[f.type];
    if (!cat) continue;
    const rank = severityRank(f.severity);
    if (rank === 0) continue;
    worst[cat] = Math.max(worst[cat], rank);
    counts[cat] += 1;
  }

  // Fold the fee-risk channel into the Fee category (doc-cap / dealer messages).
  let taxHasGovernment = false;
  if (feeRisk) {
    for (const m of feeRisk.messages) {
      if (m.severity === "critical") {
        worst.fees = Math.max(worst.fees, 3);
        counts.fees += 1;
      } else if (m.severity === "warning") {
        worst.fees = Math.max(worst.fees, 2);
        counts.fees += 1;
      }
      // "info" messages are the tax/title/registration sanity nudge.
    }
    taxHasGovernment = feeRisk.lineItems.some((li) =>
      GOVERNMENT_FEE_CATEGORIES.includes(li.category),
    );
  }

  return ORDER.map(({ key, label }) => {
    let level: CategoryLevel;
    if (key === "tax_title_reg") {
      level = taxHasGovernment ? "looks_clear" : "needs_info";
    } else {
      level = levelFromRank(worst[key]);
    }
    return { key, label, level, note: NOTES[key][level], flagCount: counts[key] };
  });
}

/** Fee/add-on flag types that belong in the unified "Fees & add-ons" section. */
export const FEE_FLAG_TYPES: FlagType[] = ["junk_fee", "overpriced_addon"];

/**
 * Split the engine's flags so each issue has ONE home in the verdict UI:
 *  - `fees`    → junk-fee / overpriced-add-on flags (the fee section)
 *  - `general` → the rest of the verdict-affecting flags (price / payment / trade)
 * Warranty flags are dropped here (the WarrantyCard is their single home); info
 * and missing_info are handled separately.
 */
export function partitionVerdictFlags(flags: Flag[]): { general: Flag[]; fees: Flag[] } {
  const general: Flag[] = [];
  const fees: Flag[] = [];
  for (const f of flags) {
    if (f.type === "missing_info" || f.type === "info") continue;
    if (FEE_FLAG_TYPES.includes(f.type)) {
      fees.push(f);
    } else if (f.type === "overpriced_warranty") {
      // Shown in the WarrantyCard — not repeated in any flag list.
    } else {
      general.push(f);
    }
  }
  return { general, fees };
}
