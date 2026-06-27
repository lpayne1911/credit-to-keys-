/**
 * ============================================================================
 *  Product catalog — single source of truth for Driveway Advocate's buyer
 *  products and where each CTA routes.
 * ============================================================================
 *
 * The app has MULTIPLE buyer-help products, not just the free deal inspector.
 * Every CTA, nav link, homepage card, products-overview card, and verdict-page
 * action is rendered from this catalog so routes never drift and no button
 * silently funnels everyone into /check.
 *
 * Honesty rule: `status` must reflect reality. Automated products that aren't
 * built yet must NOT pretend to be — use "beta", "human_review_only", or
 * "coming_soon", and route to a focused intake instead of faking a score.
 */

export type ProductStatus = "live" | "beta" | "human_review_only" | "coming_soon";

/** How the product is fulfilled. */
export type ProductType =
  | "automated" // instant rule-based scoring
  | "human_review" // a person reviews it
  | "intake"; // collects info, then routed to human review

/** Focus passed into the shared Deal Check flow for the automated sub-checks. */
export type ProductFocus = "full" | "warranty" | "apr" | "addons";

export interface Product {
  id: string;
  /** Card / nav label. */
  label: string;
  shortDescription: string;
  /** Canonical route for this product. */
  route: string;
  /** Primary CTA label. */
  ctaLabel: string;
  /** Approved alternate CTA labels (used in different placements). */
  ctaLabelAlts: string[];
  /** One-line buyer intent ("I want to…"). */
  intent: string;
  /** The stressed-buyer problem, in plain English (card lead). */
  problem: string;
  /** Who this is for, one line. */
  whoFor: string;
  /** Rough time to complete, e.g. "~30 sec". */
  estTime: string;
  /** Short fulfillment label for cards: "Instant" | "Human" | "Instant + human". */
  intakeLabel: string;
  type: ProductType;
  status: ProductStatus;
  /** Whether it produces an automated score. */
  usesAutomatedScoring: boolean;
  /** Whether a human can review it. */
  supportsHumanReview: boolean;
  /** Whether the entry screen supports uploading a quote/contract. */
  supportsUpload: boolean;
  /** For automated products, the focus passed into the Deal Check flow. */
  focus?: ProductFocus;
  emoji: string;
  /** Product-page content. */
  page: {
    /** What this product checks. */
    what: string;
    /** What the buyer needs to enter or upload. */
    inputs: string[];
    /** What result the buyer receives. */
    result: string;
  };
}

/** Human-readable status badge text (no faking — see honesty rule above). */
export const STATUS_LABEL: Record<ProductStatus, string> = {
  live: "Available now",
  beta: "Beta",
  human_review_only: "Human review only",
  coming_soon: "Coming soon",
};

export const PRODUCTS: Product[] = [
  {
    id: "deal-inspector",
    label: "Full deal check",
    shortDescription:
      "The whole quote, scored: price, fees, financing, trade-in, and warranty.",
    route: "/check",
    ctaLabel: "Start free deal check",
    ctaLabelAlts: ["Check my full deal", "Inspect my dealer quote"],
    intent: "I have a quote/worksheet and want the whole deal reviewed.",
    problem: "I have the whole deal in front of me and don't know if it's fair.",
    whoFor: "You have a quote, buyer's order, or payment worksheet.",
    estTime: "~1 min",
    intakeLabel: "Instant + human",
    type: "automated",
    status: "live",
    usesAutomatedScoring: true,
    supportsHumanReview: true,
    supportsUpload: true,
    focus: "full",
    emoji: "🔎",
    page: {
      what: "Your entire deal — vehicle price, dealer fees, APR and payment, trade-in, and any extended warranty — scored against fair-range estimates.",
      inputs: [
        "A photo/PDF of your dealer quote, buyer's order, or payment worksheet — or just tap through a few questions.",
      ],
      result:
        "A 0–100 Deal Score, a sign / push back / walk verdict, a per-category breakdown of potential savings, and a 'what to say at the desk' script.",
    },
  },
  {
    id: "warranty-check",
    label: "Warranty / service contract check",
    shortDescription:
      "Is the extended warranty / VSC / protection plan overpriced?",
    route: "/warranty-check",
    ctaLabel: "Check my warranty",
    ctaLabelAlts: ["Review my service contract", "See if the warranty is overpriced"],
    intent: "I only want to know if the warranty/service contract is fair.",
    problem: "They offered me a warranty and I don't know if the price is fair.",
    whoFor: "You were offered an extended warranty / service contract.",
    estTime: "~30 sec",
    intakeLabel: "Instant + human",
    type: "automated",
    status: "beta",
    usesAutomatedScoring: true,
    supportsHumanReview: true,
    supportsUpload: false,
    focus: "warranty",
    emoji: "🛡️",
    page: {
      what: "Just the extended warranty / vehicle service contract. Dealers may call it an extended warranty, vehicle service contract (VSC), service plan, protection plan, mechanical breakdown coverage, Honda Care, Mopar Maximum Care, Zurich, Endurance, CarShield, and more — they all belong here.",
      inputs: [
        "The vehicle (make + rough year/mileage)",
        "The coverage tier and term, if you know them",
        "The price the dealer quoted for the contract",
      ],
      result:
        "Whether the quote sits in a fair range for that coverage, the dollar gap if it's high, and a counter-offer line — as a range with a confidence level, never an exact 'fair price.'",
    },
  },
  {
    id: "apr-check",
    label: "APR / payment check",
    shortDescription: "Is the interest rate or monthly payment marked up?",
    route: "/apr-check",
    ctaLabel: "Check my APR",
    ctaLabelAlts: ["Review my payment", "See if my rate was marked up"],
    intent: "I want to know if my rate / payment / term looks suspicious.",
    problem: "The payment or interest rate feels high.",
    whoFor: "You're financing and want a rate/payment gut-check.",
    estTime: "~30 sec",
    intakeLabel: "Instant + human",
    type: "automated",
    status: "beta",
    usesAutomatedScoring: true,
    supportsHumanReview: true,
    supportsUpload: false,
    focus: "apr",
    emoji: "📈",
    page: {
      what: "The financing: your APR versus what your credit band typically qualifies for, the term, the amount financed, and whether the monthly payment looks 'packed.'",
      inputs: [
        "Your credit range (a ballpark is fine — we never pull credit)",
        "The APR, term, price, and down payment",
        "Whether you have outside financing (bank/credit-union pre-approval)",
      ],
      result:
        "A 'rate looks plausible / rate may be high / needs human review' read, with the estimated extra interest as a range — not a promise.",
    },
  },
  {
    id: "add-on-check",
    label: "Add-ons / fees check",
    shortDescription: "Review GAP, tire/wheel, paint, doc fees, and add-ons.",
    route: "/add-on-check",
    ctaLabel: "Check my add-ons",
    ctaLabelAlts: ["Review dealer fees", "Find junk fees"],
    intent: "I want to review the dealer fees and F&I add-ons.",
    problem: "They added a bunch of things and I don't know what's optional.",
    whoFor: "Your paperwork has add-ons and fees you didn't ask for.",
    estTime: "~30 sec",
    intakeLabel: "Instant + human",
    type: "automated",
    status: "beta",
    usesAutomatedScoring: true,
    supportsHumanReview: true,
    supportsUpload: false,
    focus: "addons",
    emoji: "🧾",
    page: {
      what: "Dealer fees and F&I add-ons, kept in their proper categories: junk/padded fees, GAP, tire & wheel, paint/fabric, key, maintenance, theft/GPS, the doc fee (offset, not auto-removed), and government title/registration (legitimate — itemize, don't delete). We don't lump them all into one bucket.",
      inputs: [
        "The add-ons and fees from your paperwork (tap the ones you see)",
        "The vehicle and state (for state-aware fee norms)",
      ],
      result:
        "Each item categorized as likely-junk, negotiable, government, or a service contract — with estimated clawback ranges where they apply.",
    },
  },
  {
    id: "human-review",
    label: "Human review",
    shortDescription: "Have a real advocate look at your deal.",
    route: "/human-review",
    ctaLabel: "Request human review",
    ctaLabelAlts: ["Have an advocate review this", "Send this to a real person"],
    intent: "I want a person to review my deal.",
    problem: "I just want a real person to look at this.",
    whoFor: "Anyone who'd rather have an advocate review it.",
    estTime: "~2 min to submit",
    intakeLabel: "Human",
    type: "human_review",
    status: "human_review_only",
    usesAutomatedScoring: false,
    supportsHumanReview: true,
    supportsUpload: true,
    emoji: "🧑‍⚖️",
    page: {
      what: "A human advocate reviews your numbers and paperwork and sends back a plain-English read. Decision support only — not legal or financial advice, and we never take money from dealers, lenders, or warranty companies.",
      inputs: [
        "Your quote/contract (upload or describe it)",
        "What's worrying you about the deal",
        "How to reach you with the response",
      ],
      result:
        "A written review from a real person. We'll tell you the expected turnaround when you submit. Paid review is not live yet — no charge today.",
    },
  },
  {
    id: "deal-rescue",
    label: "Already signed / deal rescue",
    shortDescription: "Bought it already? Understand your options.",
    route: "/deal-rescue",
    ctaLabel: "I already signed",
    ctaLabelAlts: ["Review my signed deal", "Help me after purchase"],
    intent: "I already bought the car and need help understanding it.",
    problem: "I already signed and now I think something's wrong.",
    whoFor: "You've purchased and want to understand your options.",
    estTime: "~3 min to submit",
    intakeLabel: "Human",
    type: "intake",
    status: "beta",
    usesAutomatedScoring: false,
    supportsHumanReview: true,
    supportsUpload: true,
    emoji: "🆘",
    page: {
      what: "Help after you've signed: understanding cancellation windows, warranty/GAP cancellation, possible overcharges, and suspicious paperwork. We can't promise cancellations or refunds — this is decision support to help you understand your options and what to ask.",
      inputs: [
        "When and where you signed, and whether you've taken delivery",
        "What products were added (warranty, GAP, add-ons)",
        "Whether you financed and still have the contract",
        "What you'd like to cancel or dispute",
      ],
      result:
        "A decision-support summary of your likely options and the questions to ask, routed to a human advocate. No guarantees of cancellation or refund.",
    },
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductByRoute(route: string): Product | undefined {
  return PRODUCTS.find((p) => p.route === route);
}

/** Products shown as "what do you need help with" cards (all of them). */
export const PRODUCT_CARDS = PRODUCTS;

/** The flagship free wedge. */
export const FREE_DEAL_INSPECTOR = PRODUCTS[0];

/** Header nav links (in order). Product entries route via the catalog. */
export interface NavLink {
  label: string;
  href: string;
  /** When true, rendered as the primary button. */
  primary?: boolean;
}
export const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Products", href: "/products" },
  { label: "Human review", href: "/human-review" },
  { label: "Deal rescue", href: "/deal-rescue" },
  { label: "Start free check", href: "/check", primary: true },
];

/** Analytics event names for CTA clicks / intake submissions. */
export const ANALYTICS_EVENTS = {
  "deal-inspector": "clicked_free_deal_check",
  "warranty-check": "clicked_warranty_check",
  "apr-check": "clicked_apr_check",
  "add-on-check": "clicked_add_on_check",
  "human-review": "clicked_human_review",
  "deal-rescue": "clicked_deal_rescue",
} as const satisfies Record<string, string>;
