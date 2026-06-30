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
import {
  SAY,
  SAY_FRAGMENTS,
  OPENERS,
  CLOSERS,
  CLEAN_DEAL_POINT,
} from "./output-contract/copy/negotiation";

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

/** Strip the smart/straight quotes a docFee scriptLine is wrapped in, so it
 *  reads as a plain numbered talking point alongside the other lines. */
function plainScriptLine(s: string): string {
  return s
    .replace(/^[“”"'\s]+/, "")
    .replace(/[“”"'\s]+$/, "")
    .trim();
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
  if (!i) return "";
  return SAY_FRAGMENTS.impact(i.low, i.high);
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
    case "government_fee":
      return "Government fees";
    case "overpriced_vehicle":
      return "Vehicle price";
    default:
      return itemName(flag);
  }
}

/** True when a fee flag is specifically about the documentation fee. */
function isDocFee(flag: Flag): boolean {
  return /\bdoc(ument)?/i.test(flag.title);
}

/** The line a buyer can say for one flag, by type. Copy lives in the catalog;
 *  this builds the small dynamic fragments and picks the template. */
function sayFor(flag: Flag, ctx: SayContext): string {
  const impact = impactNote(flag);
  switch (flag.type) {
    case "government_fee":
      return SAY.governmentFee(impact);
    case "junk_fee":
      // Doc fees are a REAL charge (sometimes state-capped) — don't demand it be
      // removed; ask for an equivalent price reduction instead (offset).
      if (isDocFee(flag)) return SAY.docFee(impact);
      return SAY.junkFee(itemName(flag), impact);
    case "overpriced_addon":
    case "redundant_addon":
      return SAY.addon(itemName(flag), impact);
    case "apr_markup":
      // Name the actual rate when we have it — concrete numbers carry weight.
      return SAY.aprMarkup(SAY_FRAGMENTS.aprLead(ctx.offeredApr), impact);
    case "payment_packing":
      return SAY.paymentPacking();
    case "overpriced_warranty": {
      const w = ctx.warranty;
      const quoted = SAY_FRAGMENTS.warrantyQuoted(w?.quotedPrice ?? null);
      const fair = w?.fairRange
        ? SAY_FRAGMENTS.warrantyFair(w.fairRange.low, w.fairRange.high)
        : "";
      return SAY.warranty(quoted, fair);
    }
    case "overpriced_vehicle":
      return SAY.vehiclePrice(impact);
    case "trade_lowball":
      return SAY.tradeLowball(impact);
    case "negative_equity":
      return SAY.negativeEquity(impact);
    default:
      return SAY.generic(itemName(flag));
  }
}

function openerFor(verdict: Verdict, hasPoints: boolean): string {
  // "Black" is a reviewer's walk-away call (fraud / legal concern). It is NOT a
  // negotiation — frame it as disengaging, regardless of how many points there
  // are, and never invite the buyer to keep dealing.
  if (verdict === "black") return OPENERS.black;
  if (!hasPoints) return OPENERS.noPoints;
  switch (verdict) {
    case "red":
      return OPENERS.red;
    case "amber":
      return OPENERS.amber;
    default:
      return OPENERS.default;
  }
}

function closerFor(verdict: Verdict): string {
  if (verdict === "black") return CLOSERS.black;
  if (verdict === "green") return CLOSERS.green;
  return CLOSERS.default;
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

  // A flag carrying a state-aware doc-fee finding contributes its specific
  // scriptLine INSTEAD of the generic junk-fee line (no duplicate). Advisory
  // doc-fee findings ride on info-severity flags, so they're folded in too.
  const points: ScriptPoint[] = realFlags.map((f) =>
    f.docFee?.scriptLine
      ? { heading: "Doc / processing fee", say: plainScriptLine(f.docFee.scriptLine) }
      : { heading: headingFor(f), say: sayFor(f, ctx) },
  );
  for (const f of result.flags) {
    if (f.type === "info" && f.docFee?.scriptLine) {
      points.push({
        heading: "Doc / processing fee",
        say: plainScriptLine(f.docFee.scriptLine),
      });
    }
  }

  // A clean deal still gets a useful point — but never on a walk-away verdict,
  // where "nothing looks off" would contradict the disengage message.
  if (points.length === 0 && result.overallVerdict !== "black") {
    points.push({ ...CLEAN_DEAL_POINT });
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
