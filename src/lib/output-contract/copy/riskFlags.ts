/**
 * ============================================================================
 *  Output Contract — risk-flag copy catalog
 * ============================================================================
 *
 * Buyer-facing titles, details, suggested actions, and impact-range bases for
 * the deal-review risk flags. The deal engine owns all the logic (which flags
 * fire, severity, ids, impact math); it reads the human-readable strings here.
 * Details that include figures are template functions; the engine passes the
 * numbers it already computed.
 */
import { usd } from "./format";

export const RISK_COPY = {
  priceAboveMarket: {
    title: "Price above local market",
    detail: (price: number, marketHigh: number, basis: string) =>
      `The selling price (${usd(price)}) is above the local market band (${usd(marketHigh)} at the top). ${basis}`,
    suggestedAction:
      "Ask to bring the selling price toward the market band before discussing monthly payment; request a revised buyer's order.",
    impactBasis: "Distance above the local market band. Not a guarantee of savings.",
  },
  dealerFee: {
    titleDocFee: "Documentation fee signal",
    titleDealer: "Dealer fee padding",
    detail: (label: string, amount: number, reason: string) =>
      `${label} (${usd(amount)}): ${reason}`,
  },
  addon: {
    titleWarranty: "Warranty markup risk",
    titleAddon: "Add-on package risk",
    detail: (label: string, amount: number, reason: string) =>
      `${label} (${usd(amount)}): ${reason}`,
  },
  aprPaymentMismatch: {
    title: "APR / payment mismatch",
    detail: (deltaPerMonth: number) =>
      "The payment does not reconcile with the APR, term, and amount financed provided." +
      ` The quoted payment differs from the reconstructed payment by about ${usd(deltaPerMonth)} per month.`,
    suggestedAction:
      "Ask the dealer to show the amount financed, APR, and term in writing so the monthly payment can be confirmed.",
  },
  termStretch: {
    title: "Long loan term",
    detail: (months: number) =>
      `The loan runs ${months} months. A longer term lowers the payment but raises total interest.`,
    suggestedAction:
      "Ask what a shorter term looks like so you can compare total interest, not just the monthly payment.",
  },
  tradeLowball: {
    title: "Trade equity concern",
    detail: (offer: number, estimatedValue: number) =>
      `The trade offer (${usd(offer)}) is below your researched value (${usd(estimatedValue)}).`,
    suggestedAction:
      "Ask the dealer to move the trade offer up, or get competing offers before agreeing.",
    impactBasis: "Difference between your researched value and the dealer's offer. Not a guarantee.",
  },
  negativeEquity: {
    title: "Trade equity concern",
    detail: (amount: number) =>
      `You owe about ${usd(amount)} more on the trade than the dealer is offering. Rolling that into the new loan increases what you finance.`,
    suggestedAction:
      "Ask to handle the payoff separately rather than rolling negative equity into the new payment.",
    impactBasis: "Trade payoff minus the dealer's offer.",
  },
  missingBuyersOrder: {
    title: "Missing buyer's order",
    detail:
      "We don't have an itemized list of fees. Without the buyer's order, padding can hide inside an out-the-door total.",
    suggestedAction:
      "Request an itemized buyer's order so every fee and add-on is listed separately.",
  },
  contractMismatchTotal: {
    title: "Contract mismatch signal",
    detail:
      "The out-the-door total is higher than the listed price, fees, and add-ons add up to, beyond a typical tax range. There may be charges not itemized here.",
    suggestedAction:
      "Ask for a line-by-line buyer's order that reconciles to the out-the-door total.",
  },
} as const;
