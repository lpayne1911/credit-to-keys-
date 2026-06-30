/**
 * buildPostSaleTriage — the pure core of Post-Sale Triage. Deterministic, no
 * network. Reuses the add-on engine to categorize each product, then layers a
 * post-sale cancellation outlook + contact/escalation/next-step plan on top.
 */
import { classifyAddOn } from "@/lib/add-on-engine/classifyAddOns";
import type { AddOnCategory } from "@/lib/add-on-engine/types";
import type {
  PostSaleInput,
  PostSaleTriageResult,
  AddOnTriage,
  CancelOutlook,
  Contact,
  TriageStep,
} from "./types";

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** Contract-based products are commonly cancellable for a prorated refund;
 *  applied/installed products usually aren't once they're on the car. */
const OFTEN_REFUNDABLE: AddOnCategory[] = ["vsc", "gap", "tire_wheel", "maintenance", "key"];
const UNLIKELY: AddOnCategory[] = ["paint_fabric", "ceramic", "appearance", "theft", "lojack_gps", "nitrogen"];

function outlookFor(category: AddOnCategory): CancelOutlook {
  if (OFTEN_REFUNDABLE.includes(category)) return "often_refundable";
  if (UNLIKELY.includes(category)) return "unlikely";
  return "unknown";
}

function refundBasisFor(outlook: CancelOutlook): string {
  switch (outlook) {
    case "often_refundable":
      return "Service/protection contracts are usually cancellable for a prorated refund based on elapsed time and miles — sometimes a full refund inside an early window.";
    case "unlikely":
      return "Applied or installed products usually aren't refundable once they're on the vehicle, but ask — some carry a limited refund or workmanship warranty.";
    default:
      return "Refund eligibility depends on this product's specific contract — ask the administrator for its cancellation terms.";
  }
}

function howToStartFor(outlook: CancelOutlook, financed: boolean): string {
  const base =
    outlook === "often_refundable"
      ? "Send a written, dated cancellation request to the product administrator named on the contract, and copy the dealer's finance (F&I) office. Keep proof of delivery."
      : "Ask the administrator and the dealer's F&I office, in writing, whether any refund applies and request the terms.";
  return financed
    ? `${base} If it was financed, the refund typically goes to your lender and reduces your loan principal — confirm they receive it.`
    : base;
}

function triageAddOn(line: { rawLabel: string; amount: number | null; financed: boolean }, financedContext: boolean): AddOnTriage {
  const assessment = classifyAddOn({ rawLabel: line.rawLabel, amount: line.amount ?? 0, financed: line.financed });
  const outlook = outlookFor(assessment.category);
  const whoToContact =
    outlook === "often_refundable"
      ? "The product administrator on your contract, plus the dealer's finance (F&I) office."
      : "The dealer's finance (F&I) office (and the product administrator, if there's a contract).";
  return {
    rawLabel: assessment.rawLabel || line.rawLabel,
    category: assessment.category,
    amount: assessment.amount,
    financedIntoLoan: assessment.financedIntoLoan,
    outlook,
    refundBasis: refundBasisFor(outlook),
    whoToContact,
    howToStart: howToStartFor(outlook, line.financed || financedContext),
  };
}

function buildContacts(input: PostSaleInput, hasRefundable: boolean): Contact[] {
  const stateName = input.buyerState ? input.buyerState.toUpperCase() : "your state";
  const contacts: Contact[] = [];

  contacts.push({
    who: input.dealerName ? `${input.dealerName} — finance (F&I) office` : "The dealer's finance (F&I) office",
    why: "They wrote up the add-on products and can start (or accept) a cancellation request.",
    how: "Call or visit; ask for the cancellation form for each product and the administrator's contact info. Follow up in writing.",
    escalation: false,
  });

  if (hasRefundable) {
    contacts.push({
      who: "The product administrator(s) on each contract",
      why: "The company that backs a service contract or GAP policy is who actually issues the prorated refund.",
      how: "Find the administrator's name and phone on the product contract; send a written, dated cancellation request.",
      escalation: false,
    });
  }

  if (input.financed) {
    contacts.push({
      who: input.lienholder ? `Your lender — ${input.lienholder}` : "Your lender / lienholder",
      why: "Refunds on financed products are usually applied to your loan principal — confirm they're received and posted.",
      how: "Call the number on your statement; ask them to confirm any add-on refund and how it's applied.",
      escalation: false,
    });
  }

  contacts.push(
    {
      who: `${stateName} Attorney General — consumer protection division`,
      why: "Handles complaints about dealer sales practices and contracts that aren't honored.",
      how: "Search your state Attorney General's website for the consumer complaint form.",
      escalation: true,
    },
    {
      who: `${stateName} DMV / motor vehicle dealer licensing board`,
      why: "Regulates licensed dealers and can act on disclosure or contract issues.",
      how: "Search your state DMV site for the dealer-complaint process.",
      escalation: true,
    },
    {
      who: "CFPB (consumerfinance.gov)",
      why: "Takes complaints about auto financing and add-ons sold with the loan.",
      how: "File online at consumerfinance.gov/complaint.",
      escalation: true,
    },
  );

  return contacts;
}

function buildDocuments(input: PostSaleInput): string[] {
  const docs = [
    "Your buyer's order / purchase contract (the itemized sale).",
    "Each add-on product contract (service contract, GAP, protection plans).",
    "Your retail installment / finance agreement, if you financed.",
    "Any cancellation forms the dealer or administrator provides.",
    "Copies of your written, dated cancellation requests and proof of delivery.",
    "Your current odometer reading (prorated refunds depend on miles).",
  ];
  if (input.financed) docs.push("Your current loan payoff statement, to confirm a refund is posted.");
  return docs;
}

function buildPlan(input: PostSaleInput, hasRefundable: boolean): TriageStep[] {
  const steps: TriageStep[] = [];
  let n = 1;

  steps.push({
    n: n++,
    title: "Gather your paperwork",
    detail: "Pull together the buyer's order, every add-on contract, and your finance agreement. You can't cancel what you can't cite.",
    timing: "Today",
  });

  steps.push({
    n: n++,
    title: "Know the cooling-off reality",
    detail: "There's generally no 3-day right to return the vehicle itself. Your leverage is the individual add-on contracts, each under its own cancellation terms.",
    timing: "Before you call",
  });

  if (hasRefundable) {
    steps.push({
      n: n++,
      title: "Send written cancellation requests",
      detail: "For each often-cancellable product, send a dated written request to the administrator and copy the dealer's F&I office. Ask for the prorated refund amount and how it's calculated.",
      timing: "This week",
    });
  } else {
    steps.push({
      n: n++,
      title: "Ask each provider for cancellation terms in writing",
      detail: "Even for products that usually aren't refundable, get the answer in writing — it sets up any later escalation.",
      timing: "This week",
    });
  }

  if (input.financed) {
    steps.push({
      n: n++,
      title: "Confirm refunds route to your loan",
      detail: "Tell your lender to expect any add-on refund and confirm it's applied to principal — refunds on financed products shouldn't come to you as a check by default.",
      timing: "Alongside step 3",
    });
  }

  steps.push({
    n: n++,
    title: "Follow up in writing",
    detail: "If you don't hear back within ~10–15 business days, resend and keep a paper trail of every contact.",
    timing: "~2 weeks out",
  });

  steps.push({
    n: n++,
    title: "Escalate if a provider won't honor its terms",
    detail: "File with your state Attorney General and DMV dealer board, and the CFPB for financing issues. A documented paper trail is what makes these effective.",
    timing: "If stalled",
  });

  return steps;
}

const ENGINE_VERSION = "post-sale-1.0.0";

export function buildPostSaleTriage(
  input: PostSaleInput,
  opts: { now?: string } = {},
): PostSaleTriageResult {
  const addOns = input.addOns
    .filter((a) => (a.rawLabel ?? "").trim() !== "")
    .map((a) => triageAddOn(a, input.financed));

  const refundable = addOns.filter((a) => a.outlook === "often_refundable");
  const cancellableCount = refundable.length;
  const ceiling = refundable.reduce((sum, a) => sum + a.amount, 0);
  const estimatedRefundCeiling = cancellableCount > 0 && ceiling > 0 ? Math.round(ceiling) : null;
  const hasRefundable = cancellableCount > 0;

  const summary =
    addOns.length === 0
      ? "Add the products you were sold (service contract, GAP, protection plans) to see what may be cancellable and how to start."
      : hasRefundable
        ? `${cancellableCount} of ${addOns.length} product${addOns.length === 1 ? "" : "s"} you were sold ${cancellableCount === 1 ? "is" : "are"} commonly cancellable for a prorated refund${estimatedRefundCeiling ? ` (up to ${money(estimatedRefundCeiling)} paid, before proration)` : ""}. Here's who to contact and how.`
        : "The products you listed usually aren't refundable once applied, but it's worth asking in writing. Here's how, and how to escalate.";

  return {
    schemaVersion: "post-sale-1",
    engineVersion: ENGINE_VERSION,
    createdAt: opts.now ?? new Date().toISOString(),
    signedContext: {
      state: input.buyerState,
      daysSinceSigned: input.daysSinceSigned,
      financed: input.financed,
    },
    summary,
    coolingOffNote:
      "Most states give NO automatic cooling-off period to return a purchased or financed vehicle — once you sign, the sale is generally final. What you often CAN cancel is the individual add-on products (service contract, GAP, etc.) under their own terms. This review focuses on those.",
    addOns,
    cancellableCount,
    estimatedRefundCeiling,
    contacts: buildContacts(input, hasRefundable),
    documents: buildDocuments(input),
    plan: buildPlan(input, hasRefundable),
    disclaimers: [
      "Decision support, not legal advice. Outcomes after signing can't be guaranteed.",
      "Refund amounts depend on each provider's contract terms — the figures here are ceilings (what you paid), not promised refunds.",
      "Buyer-side only — no commissions, no kickbacks, no advance fees.",
    ],
  };
}
