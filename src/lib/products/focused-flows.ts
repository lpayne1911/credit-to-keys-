/**
 * ============================================================================
 *  Focused product flows — product-specific question sets + result framing
 * ============================================================================
 *
 * The warranty, APR, and add-on checks are NOT the generic deal inspector with a
 * different intro. Each is its own short, plain-language flow that asks ONLY what
 * matters for that product, lets the buyer say "I don't know," offers an upload
 * instead, and maps to a focused scoring submission + a product-specific result.
 *
 * Stress-user rules honored by the renderer (FocusedCheck):
 *  - one question per screen, large tap targets, plain progress labels
 *  - manual numeric entry on money/number questions
 *  - an "I don't know" choice where a field is genuinely confusing
 *  - back never erases answers; no brand picker unless the product uses make
 */
import type { DealSubmission } from "@/lib/deal-mapper";
import type { ProductFocus } from "./product-catalog";

export type QuestionKind = "chips" | "money" | "number" | "yesno" | "text" | "vehicle";

export interface Choice {
  value: string;
  label: string;
  hint?: string;
}

export interface Question {
  /** Answer key. */
  id: string;
  /** Plain-English question. */
  label: string;
  /** Why it matters / an example, shown under the question. */
  help?: string;
  kind: QuestionKind;
  /** For chips. The renderer appends an "I don't know" choice when `idk`. */
  choices?: Choice[];
  /** Numeric config (money/number). */
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  /** Offer an explicit "I don't know / skip" choice. */
  idk?: boolean;
  /** Optional question — the renderer allows continuing without an answer. */
  optional?: boolean;
}

export type Answers = Record<string, string | number | boolean | undefined>;

export interface FocusedFlow {
  focus: Exclude<ProductFocus, "full">;
  /** Plain-language step labels for the progress indicator. */
  progressLabel: string;
  questions: Question[];
  /** Map collected answers to a (partial) scoring submission. */
  toSubmission: (a: Answers, uploadedFilePath: string | null) => DealSubmission;
}

const num = (v: unknown): number | undefined =>
  v === undefined || v === "" || v === "idk" ? undefined : Number(v);

const COVERAGE_CHOICES: Choice[] = [
  { value: "powertrain", label: "Powertrain", hint: "engine/transmission only" },
  { value: "named_component", label: "Named parts", hint: "a listed set of parts" },
  { value: "stated_component", label: "Stated parts", hint: "a broader listed set" },
  { value: "exclusionary", label: "Bumper-to-bumper", hint: "covers all but a few exclusions" },
  { value: "unknown", label: "Not sure" },
];

const CREDIT_CHOICES: Choice[] = [
  { value: "excellent", label: "Excellent", hint: "720+" },
  { value: "good", label: "Good", hint: "660–719" },
  { value: "fair", label: "Fair", hint: "600–659" },
  { value: "poor", label: "Rebuilding", hint: "under 600" },
  { value: "unknown", label: "Not sure" },
];

const TERM_CHOICES: Choice[] = [36, 48, 60, 72, 84].map((t) => ({
  value: String(t),
  label: `${t} mo`,
}));

const yearNow = new Date().getFullYear();

/* --------------------------------------------------------------------------
 *  Warranty / service contract — uses make (reliability), age, mileage, tier,
 *  term, price. Make IS asked here, and only here, because it changes the fair
 *  price. Everything else is plain-language with skips.
 * ------------------------------------------------------------------------ */
const warrantyFlow: FocusedFlow = {
  focus: "warranty",
  progressLabel: "Warranty check",
  questions: [
    {
      id: "vehicle",
      label: "What's the vehicle?",
      help: "Pick the make and model. We use the brand to estimate a fair warranty price — some brands cost more to cover. Not sure? Choose “I don't know”.",
      kind: "vehicle",
      optional: true,
    },
    {
      id: "year",
      label: "What model year?",
      help: "Older cars cost more to cover. A ballpark is fine.",
      kind: "number",
      min: 2000,
      max: yearNow + 1,
      step: 1,
      placeholder: String(yearNow - 3),
      idk: true,
    },
    {
      id: "mileage",
      label: "About how many miles?",
      help: "Higher mileage raises the fair price. Estimate is fine.",
      kind: "number",
      min: 0,
      max: 200000,
      step: 1000,
      suffix: "mi",
      placeholder: "40000",
      idk: true,
    },
    {
      id: "coverageTier",
      label: "What does it cover?",
      help: "Dealers call this an extended warranty, VSC, service contract, protection plan, Honda Care, Mopar Maximum Care, Zurich, Endurance, CarShield, and more — all fine here.",
      kind: "chips",
      choices: COVERAGE_CHOICES,
    },
    {
      id: "termMonths",
      label: "How long is the coverage?",
      kind: "chips",
      choices: TERM_CHOICES,
      idk: true,
    },
    {
      id: "priceQuoted",
      label: "What price did they quote for it?",
      help: "The price of the warranty itself — not the car.",
      kind: "money",
      min: 0,
      max: 8000,
      step: 50,
      prefix: "$",
      placeholder: "2500",
    },
    {
      id: "signed",
      label: "Have you already signed for it?",
      help: "If you have, we'll add a note on reviewing/cancelling — without promising a refund.",
      kind: "yesno",
      optional: true,
    },
  ],
  toSubmission: (a, uploadedFilePath) => ({
    vehicle: {
      make: (a.make as string) ?? "",
      model: (a.model as string) ?? "",
      trim: (a.trim as string) ?? "",
      year: num(a.year),
      mileage: num(a.mileage),
    },
    deal: { creditBand: "unknown", fees: [] },
    warranty: {
      coverageTier: (a.coverageTier as string) ?? "unknown",
      termMonths: num(a.termMonths),
      priceQuoted: num(a.priceQuoted),
    },
    inputPath: uploadedFilePath ? "upload" : "manual",
    uploadedFilePath: uploadedFilePath ?? undefined,
  }),
};

/* --------------------------------------------------------------------------
 *  APR / payment — credit band + the loan numbers. No brand picker.
 * ------------------------------------------------------------------------ */
const aprFlow: FocusedFlow = {
  focus: "apr",
  progressLabel: "APR / payment check",
  questions: [
    {
      id: "creditBand",
      label: "Roughly where's your credit?",
      help: "A ballpark is fine — we never pull your credit. It's how we catch a marked-up rate.",
      kind: "chips",
      choices: CREDIT_CHOICES,
    },
    {
      id: "vehiclePrice",
      label: "What's the vehicle price (before fees)?",
      kind: "money",
      min: 2000,
      max: 120000,
      step: 250,
      prefix: "$",
      placeholder: "28000",
      idk: true,
    },
    {
      id: "downPayment",
      label: "How much are you putting down?",
      kind: "money",
      min: 0,
      max: 40000,
      step: 250,
      prefix: "$",
      placeholder: "2000",
      optional: true,
    },
    {
      id: "apr",
      label: "What APR did they offer?",
      help: "The interest rate on the loan, e.g. 9.9%. Don't know it? Skip — enter the payment instead.",
      kind: "number",
      min: 0,
      max: 30,
      step: 0.1,
      suffix: "%",
      placeholder: "9.9",
      idk: true,
    },
    {
      id: "termMonths",
      label: "How long is the loan?",
      kind: "chips",
      choices: TERM_CHOICES,
      idk: true,
    },
    {
      id: "monthlyPayment",
      label: "What monthly payment did they quote?",
      help: "Only if you know it — we check it against the price, rate, and term.",
      kind: "money",
      min: 0,
      max: 2000,
      step: 10,
      prefix: "$",
      placeholder: "525",
      optional: true,
      idk: true,
    },
    {
      id: "outsideApproval",
      label: "Do you have your own financing approved?",
      help: "A bank or credit-union pre-approval gives you a rate to compare against.",
      kind: "yesno",
      optional: true,
    },
    {
      id: "signed",
      label: "Have you already signed?",
      help: "Includes 'spot delivery' — you drove off but the financing isn't final.",
      kind: "yesno",
      optional: true,
    },
  ],
  toSubmission: (a, uploadedFilePath) => ({
    vehicle: {},
    deal: {
      vehiclePrice: num(a.vehiclePrice),
      downPayment: num(a.downPayment),
      apr: num(a.apr),
      termMonths: num(a.termMonths),
      monthlyPayment: num(a.monthlyPayment),
      creditBand: (a.creditBand as string) ?? "unknown",
      fees: [],
    },
    inputPath: uploadedFilePath ? "upload" : "manual",
    uploadedFilePath: uploadedFilePath ?? undefined,
  }),
};

/* --------------------------------------------------------------------------
 *  Add-ons / fees — fee line items. No brand picker. Keeps government/doc
 *  fees in their own categories (the engine does the separation).
 * ------------------------------------------------------------------------ */
const ADDON_CHOICES: Choice[] = [
  { value: "service contract", label: "Service contract / warranty" },
  { value: "gap", label: "GAP" },
  { value: "nitrogen", label: "Nitrogen tire fill" },
  { value: "etch", label: "VIN etching" },
  { value: "paint", label: "Paint / fabric protection" },
  { value: "tire and wheel", label: "Tire & wheel" },
  { value: "key", label: "Key replacement" },
  { value: "prep", label: "Dealer prep" },
  { value: "doc", label: "Documentation fee" },
  { value: "market", label: "Market adjustment" },
  { value: "title", label: "Title / registration" },
];

/** Label lookup for an add-on key (shared by the renderer and the mapper). */
export const ADDON_LABELS: Record<string, string> = Object.fromEntries(
  ADDON_CHOICES.map((c) => [c.value, c.label]),
);

/**
 * Typical fallback amount per add-on, used ONLY when the buyer leaves the amount
 * blank. The renderer lets them enter the real figure off their paperwork.
 */
export const ADDON_DEFAULT_AMOUNT: Record<string, number> = {
  "service contract": 2500, gap: 995, nitrogen: 299, etch: 299, paint: 799,
  "tire and wheel": 1295, key: 399, prep: 399, doc: 499, market: 1995, title: 699,
};

const addonFlow: FocusedFlow = {
  focus: "addons",
  progressLabel: "Add-ons & fees check",
  questions: [
    {
      id: "state",
      label: "What state are you buying in?",
      help: "Fee norms and doc-fee caps vary by state.",
      kind: "text",
      placeholder: "e.g. CA",
      optional: true,
      idk: true,
    },
    {
      id: "signed",
      label: "Have you already signed?",
      kind: "yesno",
      optional: true,
    },
    // The actual line items are collected by the renderer's add-on picker, keyed
    // on this question id (multi-select handled specially in FocusedCheck).
    {
      id: "__addons",
      label: "Which of these are on your paperwork?",
      help: "Tap every line item you see. We'll keep junk fees, government fees, and the service contract in separate buckets — we don't lump them together.",
      kind: "chips",
      choices: ADDON_CHOICES,
    },
  ],
  toSubmission: (a, uploadedFilePath) => {
    // The renderer stores selected add-on keys as a comma list under __addons,
    // and the buyer-entered amount for each under `amount_<key>` (optional — we
    // fall back to a typical estimate when blank).
    const keys = String(a.__addons ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const amountFor = (k: string): number | undefined => {
      const v = a[`amount_${k}`];
      return v === undefined || v === "" || v === "idk" ? undefined : Number(v);
    };
    const fees = keys
      .filter((k) => k !== "service contract")
      .map((k) => ({ label: ADDON_LABELS[k] ?? k, amount: amountFor(k) ?? ADDON_DEFAULT_AMOUNT[k] ?? 0 }));
    const hasWarranty = keys.includes("service contract");
    return {
      vehicle: {},
      buyerState: (a.state as string) || undefined,
      deal: { creditBand: "unknown", fees },
      warranty: hasWarranty
        ? {
            coverageTier: "unknown",
            priceQuoted: amountFor("service contract") ?? ADDON_DEFAULT_AMOUNT["service contract"],
          }
        : undefined,
      inputPath: uploadedFilePath ? "upload" : "manual",
      uploadedFilePath: uploadedFilePath ?? undefined,
    };
  },
};

export const FOCUSED_FLOWS: Record<Exclude<ProductFocus, "full">, FocusedFlow> = {
  warranty: warrantyFlow,
  apr: aprFlow,
  addons: addonFlow,
};

export function getFocusedFlow(focus: ProductFocus): FocusedFlow | null {
  return focus === "full" ? null : FOCUSED_FLOWS[focus];
}
