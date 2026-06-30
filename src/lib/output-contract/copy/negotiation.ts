/**
 * ============================================================================
 *  Output Contract — negotiation script copy
 * ============================================================================
 *
 * The buyer's at-the-desk talking points, openers, and closers. The negotiation
 * module owns the logic (which flags become points, how the dollar fragments are
 * computed); it reads the sentence templates here. Compliance: suggested words,
 * never advice or a promised outcome — the closer always preserves the power to
 * walk.
 */
import { usd } from "./format";

/** The line a buyer can say for one flag. Each receives only the small dynamic
 *  fragments the engine computed (impact note, item name, rate/warranty bits). */
export const SAY = {
  governmentFee: (impact: string) =>
    `I'll pay the actual state title and registration fees — no problem. But I need that charge itemized against my state's real cost${impact}, with any dealer-retained padding removed.`,
  docFee: (impact: string) =>
    `On the documentation fee${impact}: if it's state-regulated and can't be lowered, then reduce the car's selling price by the same amount. What I care about is the out-the-door total, not which line it sits on.`,
  junkFee: (item: string, impact: string) =>
    `Please take the "${item}" charge off${impact}. I'm not paying a fee that isn't a real cost of the car.`,
  addon: (item: string, impact: string) =>
    `I don't want the ${item}${impact}. Please remove it from the numbers.`,
  aprMarkup: (lead: string, impact: string) =>
    `${lead} is higher than I qualify for${impact}. Show me the lender's buy rate, or I'll go with my own pre-approval.`,
  paymentPacking: () =>
    `Before we talk about the monthly payment, show me the full amount financed and the APR in writing — the payment is higher than these numbers add up to.`,
  warranty: (quoted: string, fair: string) =>
    `I'm not paying${quoted} for the service contract${fair}. Bring it to a fair price or I'll pass — I can buy coverage elsewhere.`,
  vehiclePrice: (impact: string) =>
    `Based on comparable listings nearby, this price is above the local market${impact}. Can you bring the selling price down closer to the market median?`,
  tradeLowball: (impact: string) =>
    `Your offer on my trade-in is low${impact}. Please come up to a fair number, or I'll get competing offers and sell it myself.`,
  negativeEquity: (impact: string) =>
    `I owe more on my trade than you're offering${impact}. I don't want that negative equity rolled into the new payment — let's handle the payoff separately.`,
  generic: (item: string) => `I'd like to go over "${item}" before I sign anything.`,
} as const;

/** Dynamic fragments embedded inside the say-lines above. */
export const SAY_FRAGMENTS = {
  aprLead: (apr: number | null) =>
    apr != null ? `The ${apr}% APR you're quoting me` : "This APR",
  /** A parenthetical " (about $low–$high)" or "" when no impact is known. */
  impact: (low: number, high: number) =>
    high > 0 ? ` (about ${usd(low)}–${usd(high)})` : "",
  warrantyQuoted: (price: number | null) =>
    price ? ` ${usd(price)}` : " this price",
  warrantyFair: (low: number, high: number) =>
    high > 0 ? ` — a fair price is closer to ${usd(low)}–${usd(high)}` : "",
} as const;

/** Opener lines, tuned to the verdict. */
export const OPENERS = {
  black: "I've had this deal reviewed, and I'm not comfortable moving forward with it.",
  noPoints: "Thanks — this looks close to fair. Before I sign, I just want to confirm a couple of things.",
  red: "Before I sign anything, I need to go through a few items on this deal.",
  amber: "I'm interested, but there are a few things I'd like to fix before we finish the paperwork.",
  default: "This is close, but I'd like to clean up a couple of items before I sign.",
} as const;

/** Closer lines — always preserve the power to walk. */
export const CLOSERS = {
  black: "I'm going to walk away from this one — please cancel the paperwork. Thanks for your time.",
  green: "If those check out, I'm ready to move forward today. I'd just like the out-the-door total in writing first.",
  default: "I'm ready to buy today if the numbers are fair — and I'm comfortable walking if they're not. Take your time.",
} as const;

/** Heading + line for a clean deal with no issues. */
export const CLEAN_DEAL_POINT = {
  heading: "Confirm the out-the-door price",
  say: "Nothing here looks off to me. Can I get the full out-the-door price in writing so I can confirm it matches what we discussed?",
} as const;
