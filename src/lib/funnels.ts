/**
 * ============================================================================
 *  Funnels — the four buyer paths and everything they render.
 * ============================================================================
 *
 * Single source of truth for the homepage path chooser, the "what happens after
 * you choose a path" board, and the four dedicated funnel pages. Keeping copy,
 * steps, deliverables, pricing, and routing here means the homepage and the pages
 * can never drift.
 *
 * Color teaches the lane: GREEN quote review, BLUE still-shopping, GOLD
 * concierge, RED post-sale. Prices live here as editable constants.
 *
 * This is additive — it does not replace `products/product-catalog.ts`, which
 * still powers the focused checks, footer, and intake validation.
 */
import type { FunnelIconName } from "@/components/funnels/icons";

export type Accent = "green" | "blue" | "gold" | "red";

export interface FunnelStep {
  n: number;
  icon: FunnelIconName;
  title: string;
  desc: string;
  time?: string;
}

export interface Deliverable {
  icon: FunnelIconName;
  label: string;
  blurb?: string;
}

export interface FunnelPricing {
  label: string;
  amount: string;
  sub?: string;
  bullets?: string[];
  addOn?: { label: string; amount: string; sub?: string };
}

export interface Funnel {
  id: string;
  accent: Accent;
  /** Homepage path card. */
  homeEyebrow: string;
  homeTitle: string;
  homeCopy: string;
  homeCta: string;
  route: string;
  /** Funnel page hero. */
  eyebrow: string;
  title: string;
  tagline: string;
  body: string;
  bullets?: string[];
  heroIcon: FunnelIconName;
  /** Workflow. */
  stepsTitle: string;
  steps: FunnelStep[];
  outcome: { title: string; body: string };
  deliverables: Deliverable[];
  /** Pricing + CTAs. */
  pricing: FunnelPricing;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Catalog product id used for lead-capture intake via /api/intake (optional). */
  intakeProductId?: string;
}

/* ---- editable price constants ---------------------------------------------- */
export const PRICES = {
  quoteReview: "$199",
  humanReview: "+$199",
  buildMyPlan: "From $349",
  dealMaker: "From $749",
  liveSupport: "From $199",
  concierge: "From $1,999",
  postSale: "$249–$499",
} as const;

export const FUNNELS: Funnel[] = [
  /* 🟢 PATH 1 — Review My Quote / Deal Rescue */
  {
    id: "quote-review",
    accent: "green",
    homeEyebrow: "I have a quote",
    homeTitle: "Review My Quote",
    homeCopy: "Review it. Challenge it. Strengthen it.",
    homeCta: "Review My Quote",
    route: "/quote-review",
    eyebrow: "Path 1 · Deal Rescue",
    title: "Deal Rescue — Quote Review",
    tagline: "Already have a quote from a dealer? Let us review it first.",
    body: "We dig into your numbers, benchmark the price, flag hidden fees and risky terms, and give you a clear plan to get a better deal.",
    bullets: [
      "Spot junk fees & overcharges",
      "Benchmark pricing in your market",
      "Plain-English recommendations & pushback scripts",
    ],
    heroIcon: "doc",
    stepsTitle: "How your quote review works",
    steps: [
      { n: 1, icon: "upload", title: "Upload your quote", desc: "Send us your dealer quote, buyer's order, or worksheet." },
      { n: 2, icon: "clipboard", title: "Quick intake", desc: "Vehicle, ZIP, trade-in, financing, and goals." },
      { n: 3, icon: "cpu", title: "AI + rules review", desc: "We analyze pricing, fees, add-ons, benchmarks, and market data." },
      { n: 4, icon: "summary", title: "Deal summary", desc: "A clear breakdown of what's fair, what's not, and where you can save." },
      { n: 5, icon: "chat", title: "Pushback script", desc: "Custom talking points to lower the price and remove junk fees." },
      { n: 6, icon: "user", title: "Optional human review", desc: "An expert advocate review for a deeper second set of eyes." },
    ],
    outcome: {
      title: "Cleaner, stronger deal",
      body: "You know your leverage and have the tools to get a better price.",
    },
    deliverables: [
      { icon: "summary", label: "Deal Review Report", blurb: "Full analysis with issues flagged and savings opportunities." },
      { icon: "chat", label: "Pushback Script", blurb: "Exact phrases to use with the dealer." },
      { icon: "target", label: "Negotiation Game Plan", blurb: "Step-by-step strategy based on your deal." },
      { icon: "listCheck", label: "Fee & Add-On Checklist", blurb: "What's optional, what to remove, what's fair." },
      { icon: "chart", label: "Market Benchmarks", blurb: "Local pricing, payment ranges, and APR comparisons." },
      { icon: "user", label: "Optional Human Review", blurb: "Add-on expert review for complex deals." },
    ],
    pricing: {
      label: "Deal Rescue — Quote Review",
      amount: PRICES.quoteReview,
      sub: "One-time fee per quote review",
      bullets: ["Same day or next business day turnaround", "Full review + pushback script"],
      addOn: { label: "Add: Human Review Upgrade", amount: PRICES.humanReview, sub: "Expert advocate review for high-stakes deals." },
    },
    primaryCta: { label: "Review My Quote", href: "/quote-review/intake" },
    secondaryCta: { label: "See a sample report", href: "/sample" },
  },

  /* 🔵 PATH 2 — Build My Plan / Target Deal Sheet */
  {
    id: "build-my-plan",
    accent: "blue",
    homeEyebrow: "I'm still shopping",
    homeTitle: "Build My Plan",
    homeCopy: "Build a plan. Know your numbers. Walk in strong.",
    homeCta: "Build My Plan",
    route: "/build-my-plan",
    eyebrow: "Path 2 · Co-Pilot / Deal Maker",
    title: "Build My Plan",
    tagline: "For smart buyers who want to prepare before they go to the dealership.",
    body: "We build your target numbers, fee checklist, and negotiation game plan before you talk price.",
    bullets: [
      "We build your target numbers and negotiation game plan.",
      "You walk in prepared, confident, and in control.",
      "No commissions. No kickbacks. Just better information.",
    ],
    heroIcon: "target",
    stepsTitle: "The still-shopping / planning funnel",
    steps: [
      { n: 1, icon: "car", title: "Vehicle & goals", desc: "Tell us what you want, your must-haves, and your budget." },
      { n: 2, icon: "clipboard", title: "Provide details", desc: "Share vehicle, trade-in, financing, and timing details." },
      { n: 3, icon: "summary", title: "Build Target Deal Sheet", desc: "We research your market and build your custom numbers." },
      { n: 4, icon: "target", title: "Negotiation game plan", desc: "A step-by-step strategy based on your target." },
      { n: 5, icon: "chat", title: "Scripts & talking points", desc: "Exact phrases to use with confidence." },
      { n: 6, icon: "headset", title: "Optional live support", desc: "Add-on support while you're at the dealership." },
    ],
    outcome: {
      title: "Walk in prepared",
      body: "You have the plan, the numbers, and the confidence to win at the dealership.",
    },
    deliverables: [
      { icon: "summary", label: "Custom Target Deal Sheet", blurb: "Out-the-door number, fees checklist, trade target, financing benchmark." },
      { icon: "listCheck", label: "Fee & Add-On Checklist", blurb: "What's legit, what's optional, what to avoid." },
      { icon: "target", label: "Negotiation Game Plan", blurb: "A step-by-step plan tailored to your deal." },
      { icon: "chat", label: "Scripts & Talking Points", blurb: "Words and phrases to handle objections." },
      { icon: "chart", label: "Financing Benchmark", blurb: "Target APR range and term guidance." },
      { icon: "headset", label: "Optional Live Support", blurb: "Real-time help while you're at the dealership." },
    ],
    pricing: {
      label: "Build My Plan",
      amount: PRICES.buildMyPlan,
      sub: "Co-Pilot from $349 · Deal Maker (full strategy) from $749",
      bullets: ["Custom Target Deal Sheet™", "Negotiation game plan + scripts", "Fee, trade, and financing benchmarks"],
      addOn: { label: "Add: Live Support at the Dealership", amount: PRICES.liveSupport, sub: "Chat or call support when you're at the desk." },
    },
    primaryCta: { label: "Build My Plan", href: "#start" },
    secondaryCta: { label: "See a sample report", href: "/sample" },
    intakeProductId: "build-my-plan",
  },

  /* 🟡 PATH 3 — Concierge */
  {
    id: "concierge",
    accent: "gold",
    homeEyebrow: "Handle it for me",
    homeTitle: "Start Concierge",
    homeCopy: "We negotiate, compare, and handle the details.",
    homeCta: "Start Concierge",
    route: "/concierge",
    eyebrow: "Path 3 · Concierge",
    title: "Concierge — We Handle It",
    tagline: "Your personal buyer advocate, from start to keys.",
    body: "We source, negotiate, and handle the entire car-buying process so you get the right vehicle, at the right price, with none of the stress.",
    bullets: [
      "Expert sourcing & comparison",
      "Dealer negotiation on your behalf",
      "Paperwork review & protection",
      "Delivery coordination & support",
    ],
    heroIcon: "key",
    stepsTitle: "The concierge funnel — we handle it for you",
    steps: [
      { n: 1, icon: "clipboard", title: "Application", desc: "Tell us about your needs and what you're looking for.", time: "10 minutes" },
      { n: 2, icon: "phone", title: "Discovery call", desc: "We confirm scope, timeline, and preferences.", time: "30–45 minutes" },
      { n: 3, icon: "search", title: "Sourcing & comparison", desc: "We find inventory, compare offers, and recommend the best options.", time: "1–2 days" },
      { n: 4, icon: "handshake", title: "Dealer negotiation", desc: "We negotiate price, fees, add-ons, and terms on your behalf.", time: "1–3 days" },
      { n: 5, icon: "summary", title: "Paperwork review", desc: "We review all documents and explain everything clearly.", time: "1 day" },
      { n: 6, icon: "car", title: "Delivery coordination", desc: "We coordinate delivery, registration, and final details.", time: "1–3 days" },
    ],
    outcome: {
      title: "We handle the heavy lifting",
      body: "Save time and stress while we work to secure a clean deal on your behalf.",
    },
    deliverables: [
      { icon: "listCheck", label: "Offer Comparison", blurb: "We compare multiple offers and find the best fit for your goals." },
      { icon: "chat", label: "Negotiation Updates", blurb: "We negotiate with dealers and keep you in the loop." },
      { icon: "summary", label: "Document Review", blurb: "We review paperwork and explain everything clearly." },
      { icon: "car", label: "Delivery Coordination", blurb: "We coordinate delivery, registration, and final details." },
    ],
    pricing: {
      label: "Concierge — We Handle It",
      amount: PRICES.concierge,
      sub: "Application-based. Scope and flat fee confirmed on your discovery call.",
      bullets: ["Vehicle sourcing & comparison", "Direct negotiation with dealers", "Paperwork review & delivery coordination"],
    },
    primaryCta: { label: "Start Concierge", href: "#start" },
    secondaryCta: { label: "Apply Now", href: "#start" },
    intakeProductId: "concierge",
  },

  /* 🔴 PATH 4 — Already Signed / Post-Sale Triage */
  {
    id: "post-sale-triage",
    accent: "red",
    homeEyebrow: "Already signed",
    homeTitle: "Post-Sale Triage",
    homeCopy: "Post-sale help and options review.",
    homeCta: "Post-Sale Triage",
    route: "/post-sale-triage",
    eyebrow: "Path 4 · Post-Sale Triage",
    title: "Already Signed — Post-Sale Triage",
    tagline: "You've already signed. Let's understand your options.",
    body: "We help you understand your options, organize your paperwork, and pursue the best next steps available. Post-sale results cannot be guaranteed.",
    heroIcon: "shieldAlert",
    stepsTitle: "Your post-sale triage workflow",
    steps: [
      { n: 1, icon: "upload", title: "Upload signed paperwork", desc: "Securely upload your contract, add-ons, and supporting docs." },
      { n: 2, icon: "alert", title: "Issue triage", desc: "We identify key issues, potential concerns, and what may be cancellable." },
      { n: 3, icon: "xCircle", title: "Cancellable add-ons check", desc: "We check each product for cancellation eligibility and provider rules." },
      { n: 4, icon: "user", title: "Who to contact", desc: "We identify the right people, departments, and contact methods." },
      { n: 5, icon: "map", title: "Escalation map", desc: "If needed, we map escalation routes, including oversight agencies." },
      { n: 6, icon: "listCheck", title: "Next-step plan", desc: "A clear action plan with next steps and a recommended timeline." },
    ],
    outcome: {
      title: "Post-sale options map",
      body: "Know your options and the best next step. Results after signing cannot be guaranteed.",
    },
    deliverables: [
      { icon: "shieldAlert", label: "Cancellation Options Report", blurb: "What may be cancellable and how to start the process." },
      { icon: "phone", label: "Who-To-Contact Map", blurb: "The right contacts and how to reach them." },
      { icon: "listCheck", label: "Documentation Checklist", blurb: "What to gather and what to keep." },
      { icon: "map", label: "Escalation & Next-Step Plan", blurb: "Escalation routes and recommended next steps." },
    ],
    pricing: {
      label: "Post-Sale Options Review",
      amount: PRICES.postSale,
      sub: "A document and options review — not a Deal Score. Final price depends on scope.",
      bullets: ["Cancellation options report", "Who-to-contact map", "Documentation checklist & escalation plan"],
    },
    primaryCta: { label: "Upload Signed Paperwork", href: "#start" },
    secondaryCta: { label: "Review My Post-Sale Options", href: "#start" },
    intakeProductId: "deal-rescue",
  },
];

export function getFunnel(id: string): Funnel | undefined {
  return FUNNELS.find((f) => f.id === id);
}

/** Tailwind class helpers per accent — keeps funnel components consistent. */
export const ACCENT_CLASSES: Record<
  Accent,
  { text: string; textDark: string; bar: string; soft: string; softText: string; btn: string; ring: string }
> = {
  green: { text: "text-green", textDark: "text-green-dark", bar: "bg-green", soft: "bg-green-soft", softText: "text-green-dark", btn: "btn-green", ring: "ring-green/30" },
  blue: { text: "text-blue", textDark: "text-blue-dark", bar: "bg-blue", soft: "bg-blue-soft", softText: "text-blue-dark", btn: "btn-blue", ring: "ring-blue/30" },
  gold: { text: "text-gold-dark", textDark: "text-gold-dark", bar: "bg-gold", soft: "bg-gold-soft", softText: "text-gold-dark", btn: "btn-gold", ring: "ring-gold/30" },
  red: { text: "text-red", textDark: "text-red-dark", bar: "bg-red", soft: "bg-red-soft", softText: "text-red-dark", btn: "btn-red", ring: "ring-red/30" },
};
