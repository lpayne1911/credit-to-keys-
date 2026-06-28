/**
 * Fee classifier — normalizes free-text fee labels into categories and turns a
 * buyer's fee list + state into compliance-safe, buyer-side guidance.
 *
 * This is the bridge between a buyer's worksheet and the fee-rule context. It is
 * NOT legal advice and makes no legal determination. Messages are consumer
 * guidance only: they say what a line *appears* to be and ask the buyer to
 * confirm with the dealer in writing — never that anything is illegal.
 *
 * Pure + deterministic. It does NOT feed the fairness score; it's a parallel
 * output channel.
 */
import { getFeeRules } from "./fee-rules";

export type FeeCategory =
  | "doc_fee"
  | "dealer_addon"
  | "government_fee"
  | "tax"
  | "registration"
  | "title"
  | "junk_fee"
  | "unknown";

export type FeeRiskSeverity = "info" | "warning" | "critical";

export interface FeeLineReview {
  label: string;
  amount: number;
  category: FeeCategory;
}

export interface FeeRiskMessage {
  severity: FeeRiskSeverity;
  title: string;
  message: string;
}

export interface FeeRiskAssessment {
  /** Resolved 2-letter state, or null when unknown. */
  state: string | null;
  ruleConfidence: "low" | "medium" | "high";
  lineItems: FeeLineReview[];
  messages: FeeRiskMessage[];
}

/**
 * Ordered keyword rules (case-insensitive substring). Order matters: more
 * specific government/pass-through categories are checked before the broad
 * dealer/junk buckets so a "title" or "registration" line isn't mislabeled.
 */
const CATEGORY_RULES: { category: FeeCategory; keywords: string[] }[] = [
  { category: "tax", keywords: ["sales tax", "use tax", "excise", "tax"] },
  { category: "title", keywords: ["title"] },
  {
    category: "registration",
    keywords: [
      "registration", "registry", "license", "plate", "tag",
      "electronic filing", "e-file", "efile", "filing",
    ],
  },
  {
    category: "government_fee",
    keywords: ["government", "state fee", "county fee", "dmv", "smog", "inspection fee"],
  },
  {
    category: "doc_fee",
    keywords: ["documentation", "documentary", "doc fee", "processing", "conveyance"],
  },
  {
    category: "junk_fee",
    keywords: [
      "nitrogen", "etch", "paint protection", "fabric", "sealant", "protection",
      "market adjustment", "market adj", "addendum", "adp", "procurement",
      "appearance", "theft", "lojack", "gps", "pinstripe",
    ],
  },
  {
    category: "dealer_addon",
    keywords: ["dealer prep", "prep", "recon", "reconditioning", "dealer fee", "dealer service", "delivery", "handling"],
  },
];

/** Normalize a single fee label into a category (case-insensitive). */
export function classifyFeeLabel(label: string): FeeCategory {
  const l = (label ?? "").toLowerCase();
  if (!l.trim()) return "unknown";
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => l.includes(k))) return rule.category;
  }
  return "unknown";
}

const DEALERISH: FeeCategory[] = ["dealer_addon", "junk_fee"];
const GOVERNMENTISH: FeeCategory[] = ["government_fee", "tax", "title", "registration"];

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * Review a buyer's fee list against their state's rule context. Returns
 * normalized line items + buyer-facing guidance messages. `state` may be null.
 */
export function reviewFees(
  fees: { label: string; amount: number }[],
  state: string | null,
): FeeRiskAssessment {
  const rules = getFeeRules(state);

  const lineItems: FeeLineReview[] = fees
    .filter((f) => (f.label ?? "").trim())
    .map((f) => ({
      label: f.label.trim(),
      amount: Number.isFinite(f.amount) ? f.amount : 0,
      category: classifyFeeLabel(f.label),
    }));

  const messages: FeeRiskMessage[] = [];

  // Doc fee vs. known cap.
  for (const d of lineItems.filter((l) => l.category === "doc_fee")) {
    const overCap =
      rules.docFeeCap != null &&
      (rules.docFeeCapType === "hard_cap" || rules.docFeeCapType === "regulated") &&
      d.amount > rules.docFeeCap;
    if (overCap) {
      const word = rules.docFeeCapType === "hard_cap" ? "cap" : "guideline";
      messages.push({
        severity: rules.docFeeCapType === "hard_cap" ? "critical" : "warning",
        title: "Doc fee appears above known state cap",
        message: `The entered doc/processing fee (${money(d.amount)}) appears higher than ${rules.state}'s known ${word} of about ${money(rules.docFeeCap as number)}. Confirm the amount and ask the dealer to correct or explain it in writing.`,
      });
    } else {
      messages.push({
        severity: "warning",
        title: "Dealer processing fee may need review",
        message:
          "This fee appears to be dealer-retained, not a government fee. Ask the dealer to identify whether it is optional, taxable, and negotiable, and to compare it against your state's known rules.",
      });
    }
  }

  // Dealer-created / add-on / junk lines.
  const dealerish = lineItems.filter((l) => DEALERISH.includes(l.category));
  if (dealerish.length) {
    messages.push({
      severity: "warning",
      title: "Dealer-added fees to question",
      message: `${dealerish.length} line item(s) appear dealer-created rather than government-required (${dealerish
        .map((d) => d.label)
        .join(", ")}). Ask the dealer to identify which are optional and negotiable, and to put the answer in writing.`,
    });
  }

  // Tax / title / registration sanity check (always present).
  const hasGov = lineItems.some((l) => GOVERNMENTISH.includes(l.category));
  messages.push({
    severity: "info",
    title: "Tax, title & registration sanity check",
    message: hasGov
      ? "Some government fees appear in your numbers. Ask for the itemized out-the-door breakdown so taxes, title, and registration are separated from dealer charges."
      : "No itemized government fees (tax, title, registration) are visible yet. Ask the dealer for the full itemized out-the-door price so these can be reviewed separately.",
  });

  const ruleConfidence =
    rules.docFeeCapType === "unknown" ? "low" : rules.registrationRuleConfidence;

  return {
    state: rules.state === "UNKNOWN" ? null : rules.state,
    ruleConfidence,
    lineItems,
    messages,
  };
}
