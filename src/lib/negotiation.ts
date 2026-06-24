/**
 * ============================================================================
 *  Driveway Advocate — Negotiation Script
 * ============================================================================
 *
 * Turns a scored verdict into a short, plain-spoken script the buyer can read
 * off their phone AT THE DESK. The fairness engine says what's wrong; this says
 * what to actually SAY about it — calm, firm, buyer-side, with the dollar
 * figures that give the buyer footing.
 *
 * Pure and deterministic: same verdict in, same script out. No engine or
 * pricing logic lives here — it only rephrases existing flags into talking
 * points, so it can be unit-tested and stays decoupled from scoring.
 *
 * Compliance: these are SUGGESTED words, not advice or a promise of an outcome.
 * The UI frames them as "you could say," and the closer always preserves the
 * buyer's power to walk.
 * ============================================================================
 */
import type {
  FairnessResult,
  Flag,
  Verdict,
  WarrantyAssessment,
} from "./fairness-engine";

export interface ScriptPoint {
  /** Short label for the issue, e.g. "Nitrogen tire fill". */
  heading: string;
  /** The line the buyer can say — plain and firm. */
  say: string;
}

export interface NegotiationScript {
  /** How to open the conversation, tuned to the verdict. */
  opener: string;
  /** One talking point per real issue (junk fees, markup, warranty, …). */
  points: ScriptPoint[];
  /** How to close — always preserves the power to walk. */
  closer: string;
  /** Flat plain-text version for copy-to-clipboard / screenshot. */
  asText: string;
}

/** Optional real-world figures that make the high-value lines specific. */
export interface ScriptContext {
  /** The APR the dealer actually quoted, so the rate line can name it. */
  offeredApr?: number | null;
}

/** Internal context the say-lines draw on — built from the result + caller. */
interface SayContext {
  offeredApr: number | null;
  warranty: WarrantyAssessment | null;
}

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** The specific item a fee/add-on flag is about, pulled from its title. */
function itemName(flag: Flag): string {
  // Fee titles read like "Likely junk fee: Nitrogen tire fill" (prefix before a
  // colon) or "Documentation fee looks high" (a "looks high" suffix). Strip both
  // so the talking point names the item cleanly.
  let name = flag.title.includes(":")
    ? flag.title.slice(flag.title.indexOf(":") + 1)
    : flag.title;
  name = name.replace(/\s+looks?\s+high$/i, "").trim();
  return name || flag.title.trim();
}

/** A parenthetical dollar range for a flag's impact, or "" when unknown. */
function impactNote(flag: Flag): string {
  const i = flag.estimatedImpact;
  if (!i || i.high <= 0) return "";
  return ` (about ${money(i.low)}–${money(i.high)})`;
}

/** A short, stable label for a flag — never leaks raw title fragments. */
function headingFor(flag: Flag): string {
  switch (flag.type) {
    case "apr_markup":
      return "Interest rate";
    case "payment_packing":
      return "Monthly payment";
    case "overpriced_warranty":
      return "Extended warranty";
    case "trade_lowball":
      return "Trade-in offer";
    case "negative_equity":
      return "Trade-in payoff";
    default:
      return itemName(flag);
  }
}

/** The line a buyer can say for one flag, by type. */
function sayFor(flag: Flag, ctx: SayContext): string {
  const impact = impactNote(flag);
  switch (flag.type) {
    case "junk_fee":
      return `Please take the "${itemName(flag)}" charge off${impact}. I'm not paying a fee that isn't a real cost of the car.`;
    case "overpriced_addon":
    case "redundant_addon":
      return `I don't want the ${itemName(flag)}${impact}. Please remove it from the numbers.`;
    case "apr_markup": {
      // Name the actual rate when we have it — concrete numbers carry weight.
      const lead =
        ctx.offeredApr != null
          ? `The ${ctx.offeredApr}% APR you're quoting me`
          : "This APR";
      return `${lead} is higher than I qualify for${impact}. Show me the lender's buy rate, or I'll go with my own pre-approval.`;
    }
    case "payment_packing":
      return `Before we talk about the monthly payment, show me the full amount financed and the APR in writing — the payment is higher than these numbers add up to.`;
    case "overpriced_warranty": {
      const w = ctx.warranty;
      const quoted =
        w && w.quotedPrice ? ` ${money(w.quotedPrice)}` : " this price";
      const fair =
        w && w.fairRange && w.fairRange.high > 0
          ? ` — a fair price is closer to ${money(w.fairRange.low)}–${money(w.fairRange.high)}`
          : "";
      return `I'm not paying${quoted} for the service contract${fair}. Bring it to a fair price or I'll pass — I can buy coverage elsewhere.`;
    }
    case "trade_lowball":
      return `Your offer on my trade-in is low${impact}. Please come up to a fair number, or I'll get competing offers and sell it myself.`;
    case "negative_equity":
      return `I owe more on my trade than you're offering${impact}. I don't want that negative equity rolled into the new payment — let's handle the payoff separately.`;
    default:
      return `I'd like to go over "${itemName(flag)}" before I sign anything.`;
  }
}

function openerFor(verdict: Verdict, hasPoints: boolean): string {
  if (!hasPoints) {
    return "Thanks — this looks close to fair. Before I sign, I just want to confirm a couple of things.";
  }
  switch (verdict) {
    case "red":
    case "black":
      return "Before I sign anything, I need to go through a few items on this deal.";
    case "amber":
      return "I'm interested, but there are a few things I'd like to fix before we finish the paperwork.";
    default:
      return "This is close, but I'd like to clean up a couple of items before I sign.";
  }
}

function closerFor(verdict: Verdict): string {
  if (verdict === "green") {
    return "If those check out, I'm ready to move forward today. I'd just like the out-the-door total in writing first.";
  }
  return "I'm ready to buy today if the numbers are fair — and I'm comfortable walking if they're not. Take your time.";
}

/**
 * Build the buyer's at-the-desk script from a scored verdict. Real issues
 * (junk fees, markup, packing, overpriced warranty) become talking points;
 * missing-info/info notes are ignored. A clean deal still gets a short,
 * confidence-preserving script.
 */
export function buildNegotiationScript(
  result: FairnessResult,
  context: ScriptContext = {},
): NegotiationScript {
  const ctx: SayContext = {
    offeredApr: context.offeredApr ?? null,
    warranty: result.warranty,
  };

  const realFlags = result.flags.filter(
    (f) => f.type !== "missing_info" && f.type !== "info",
  );

  const points: ScriptPoint[] = realFlags.map((f) => ({
    heading: headingFor(f),
    say: sayFor(f, ctx),
  }));

  if (points.length === 0) {
    points.push({
      heading: "Confirm the out-the-door price",
      say: "Nothing here looks off to me. Can I get the full out-the-door price in writing so I can confirm it matches what we discussed?",
    });
  }

  const opener = openerFor(result.overallVerdict, realFlags.length > 0);
  const closer = closerFor(result.overallVerdict);

  const asText = [
    opener,
    "",
    ...points.map((p, i) => `${i + 1}. ${p.say}`),
    "",
    closer,
  ].join("\n");

  return { opener, points, closer, asText };
}
