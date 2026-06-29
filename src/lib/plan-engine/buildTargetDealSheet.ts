/**
 * buildTargetDealSheet — the pure core of Build My Plan. No network, no Date:
 * the API resolves market data + the state doc-fee rule and passes them in, so
 * this is deterministic and unit-testable. It never invents tax or government
 * fees (those vary by locality); it states only what it can defend.
 */
import { monthlyPayment } from "@/lib/loan-math";
import { LIKELY_APR_BAND } from "@/lib/fairness-engine";
import type { DocFeeRule } from "@/lib/intelligence/docFeeRules";
import type {
  TargetPlanInput,
  TargetDealSheet,
  TargetFee,
  PlanMarket,
  PlanFinancing,
  PlanStep,
  PlanScript,
} from "./types";

const DEFAULT_TERM_MONTHS = 60;

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function vehicleLabelOf(v: TargetPlanInput["vehicle"]): string {
  const label = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim();
  return label || "your target vehicle";
}

/** Trade equity = value − payoff. Null unless we have a value to work from. */
function tradeEquityOf(input: TargetPlanInput): number | null {
  const t = input.trade;
  if (!t || t.estimatedValue == null) return null;
  return Math.round(t.estimatedValue - (t.loanPayoff ?? 0));
}

/** Build the expected-fee checklist. Only the doc fee gets a target number, and
 *  only when the state caps it; tax + government fees are flagged "confirm". */
function buildFees(input: TargetPlanInput, rule: DocFeeRule | null | undefined): TargetFee[] {
  const stateName = rule?.stateName ?? "your state";
  const docCap = rule?.maxAmountCents != null ? Math.round(rule.maxAmountCents / 100) : null;

  const docFee: TargetFee =
    docCap != null
      ? {
          label: "Doc / processing fee",
          target: docCap,
          kind: "negotiable",
          note: `${stateName} caps this at ${money(docCap)}. It's dealer profit, not a government charge — don't pay above the cap, and ask them to waive or reduce it.`,
        }
      : {
          label: "Doc / processing fee",
          target: null,
          kind: "negotiable",
          note: rule
            ? `${stateName} sets no hard dollar cap. It's dealer-controlled profit — treat it as negotiable and push to reduce or waive it.`
            : "Dealer-controlled profit, not a government charge — negotiable. Add your state to see any cap that applies.",
        };

  return [
    docFee,
    {
      label: "Title & registration",
      target: null,
      kind: "government",
      note: "Set by your state DMV — a real government fee. Confirm the exact amount; it isn't negotiable.",
    },
    {
      label: "Sales tax",
      target: null,
      kind: "varies",
      note: "Based on your state/local rate and the taxable base (price, trade, rebates differ by state). Confirm locally — it's not included in the financed estimate below.",
    },
  ];
}

function buildFinancing(
  input: TargetPlanInput,
  market: PlanMarket,
  docFeeTarget: number | null,
): PlanFinancing {
  const aprBand = LIKELY_APR_BAND[input.creditBand];
  const termMonths = input.termMonths && input.termMonths > 0 ? input.termMonths : DEFAULT_TERM_MONTHS;
  const tradeEquity = tradeEquityOf(input);

  let estPrincipal: number | null = null;
  if (market.targetPrice != null) {
    const gross = market.targetPrice + (docFeeTarget ?? 0);
    const reductions = (input.downPayment ?? 0) + (tradeEquity != null && tradeEquity > 0 ? tradeEquity : 0);
    estPrincipal = Math.max(0, Math.round(gross - reductions));
  }

  const estMonthlyLow =
    estPrincipal != null ? Math.round(monthlyPayment(estPrincipal, aprBand.low, termMonths)) : null;
  const estMonthlyHigh =
    estPrincipal != null ? Math.round(monthlyPayment(estPrincipal, aprBand.high, termMonths)) : null;

  const termDefaulted = !(input.termMonths && input.termMonths > 0);
  const note =
    `Estimate at the target price over ${termMonths} months${termDefaulted ? " (default term)" : ""}, using a wide ` +
    `${input.creditBand} APR band (${aprBand.low}%–${aprBand.high}%) — a planning range, not a rate quote. ` +
    `EXCLUDES sales tax and government fees. Get pre-approved at your bank or credit union first, then make the dealer beat it.`;

  return { creditBand: input.creditBand, aprBand, termMonths, estPrincipal, estMonthlyLow, estMonthlyHigh, note };
}

function buildGamePlan(
  input: TargetPlanInput,
  market: PlanMarket,
  fees: TargetFee[],
  financing: PlanFinancing,
): PlanStep[] {
  const steps: PlanStep[] = [];
  let n = 1;

  if (market.targetPrice != null) {
    const anchor = market.marketMedian != null ? ` Local median runs about ${money(market.marketMedian)}.` : "";
    steps.push({
      n: n++,
      title: `Anchor on a target price near ${money(market.targetPrice)}`,
      detail: `That's a realistically achievable price for this vehicle in your area, not sticker.${anchor} Open on price only — ignore monthly payment until the price is set.`,
    });
  } else {
    steps.push({
      n: n++,
      title: "Pin down a target price first",
      detail: "Add the vehicle and your ZIP so we can benchmark a realistic local price to anchor on before you talk to a dealer.",
    });
  }

  steps.push({
    n: n++,
    title: "Line up financing before you go",
    detail: `Get pre-approved at a bank or credit union. For ${input.creditBand} credit, plan around ${financing.aprBand.low}%–${financing.aprBand.high}% APR and make the dealer beat your rate — don't take theirs on faith.`,
  });

  steps.push({
    n: n++,
    title: "Negotiate out-the-door, never the monthly payment",
    detail: "A low monthly payment can hide a stretched term, a marked-up rate, or padded add-ons. Settle the total out-the-door number, then the financing.",
  });

  const docFee = fees.find((f) => f.label.startsWith("Doc"));
  if (docFee) {
    steps.push({
      n: n++,
      title: docFee.target != null ? `Hold the doc fee at or below ${money(docFee.target)}` : "Push back on the doc fee",
      detail: docFee.note,
    });
  }

  steps.push({
    n: n++,
    title: "Decline add-ons you didn't come for",
    detail: "Paint protection, nitrogen, VIN etching, GAP, and service contracts are optional and high-margin. Say no by default; you can buy GAP cheaper from your own insurer later.",
  });

  if (input.trade) {
    steps.push({
      n: n++,
      title: "Keep your trade-in separate",
      detail: "Settle the purchase price first, then the trade — don't let them blend the two. Get an independent trade quote (e.g. an instant cash offer) so you know your floor.",
    });
  }

  return steps;
}

function buildScripts(market: PlanMarket, fees: TargetFee[]): PlanScript[] {
  const scripts: PlanScript[] = [];
  if (market.targetPrice != null) {
    scripts.push({
      heading: "Open on price",
      say: `Based on local comparable listings, I'm targeting about ${money(market.targetPrice)} on the vehicle price. Can you work to that number?`,
    });
  }
  scripts.push({
    heading: "Out-the-door",
    say: "Before we talk monthly payments, I need the full out-the-door price in writing — every fee included.",
  });
  const docFee = fees.find((f) => f.label.startsWith("Doc"));
  if (docFee) {
    scripts.push({
      heading: "Doc / processing fee",
      say:
        docFee.target != null
          ? `I know the doc fee is capped at ${money(docFee.target)} here, and it's dealer profit — please bring it to the cap or waive it.`
          : "The doc fee is dealer profit, not a government charge. Please reduce or waive it.",
    });
  }
  scripts.push({
    heading: "Financing",
    say: "I'm pre-approved through my bank. If you can beat my rate I'll consider dealer financing — otherwise I'll use mine.",
  });
  return scripts;
}

function buildMissing(input: TargetPlanInput, market: PlanMarket): string[] {
  const missing: string[] = [];
  if (!input.zip) missing.push("Add your ZIP code for local market pricing.");
  if (!input.buyerState) missing.push("Add your state to apply the right doc-fee cap and fee rules.");
  if (input.creditBand === "unknown") missing.push("Tell us your credit range for a tighter APR estimate.");
  if (!input.termMonths) missing.push("Choose a loan term to firm up the monthly estimate.");
  if (market.isEstimate) missing.push("Market pricing is a demo estimate here — a live lookup sharpens the target price.");
  return missing;
}

export function buildTargetDealSheet(
  input: TargetPlanInput,
  deps: { market: PlanMarket; docFeeRule?: DocFeeRule | null },
): TargetDealSheet {
  const fees = buildFees(input, deps.docFeeRule);
  const docFeeTarget = fees.find((f) => f.label.startsWith("Doc"))?.target ?? null;
  const financing = buildFinancing(input, deps.market, docFeeTarget);
  const gamePlan = buildGamePlan(input, deps.market, fees, financing);
  const scripts = buildScripts(deps.market, fees);
  const missing = buildMissing(input, deps.market);

  return {
    schemaVersion: "target-plan-1",
    vehicleLabel: vehicleLabelOf(input.vehicle),
    pricing: deps.market,
    tradeEquity: tradeEquityOf(input),
    fees,
    financing,
    gamePlan,
    scripts,
    missing,
    disclaimers: [
      "Decision support, not financial or legal advice. You make the final call.",
      "Estimates are planning ranges, not quotes. Confirm tax, government fees, and your actual rate before you sign.",
      "Buyer-side only — no commissions, no kickbacks, no advance fees.",
    ],
  };
}
