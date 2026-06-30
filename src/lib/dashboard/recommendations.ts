/**
 * Dashboard recommendations — DERIVED next steps, driven by the buyer's actual
 * case/deal/engagement state (never generic product cards, never a tier).
 *
 * Pure: input is the buyer's engagements + cases + a saved-deal count, output is
 * an ordered, de-duplicated list of at most `limit` suggestions. No I/O — safe
 * to unit test.
 */
import type { CaseRow, EngagementRow, EngagementService } from "@/lib/types";

export interface Recommendation {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const RECURRING: ReadonlySet<EngagementService> = new Set([
  "credit_to_keys",
  "buyer_advocate",
  "concierge",
]);

/** Services a buyer has engaged. */
function servicesOf(engagements: EngagementRow[]): Set<EngagementService> {
  return new Set(engagements.map((e) => e.service));
}

export function isRecurringService(service: EngagementService): boolean {
  return RECURRING.has(service);
}

/**
 * Build up to `limit` recommendations. Rules are ordered by intent: finish what's
 * started, deepen what's delivered, then widen. The first matching, non-duplicate
 * rules win.
 */
export function recommendationsFor(
  engagements: EngagementRow[],
  cases: CaseRow[],
  savedDealCount: number,
  limit = 3,
): Recommendation[] {
  const services = servicesOf(engagements);
  const caseTypes = new Set(cases.map((c) => c.type));
  const hasDelivered = cases.some(
    (c) => c.status === "delivered" || c.status === "payment_pending",
  );
  const out: Recommendation[] = [];
  const push = (r: Recommendation) => {
    if (!out.some((x) => x.id === r.id)) out.push(r);
  };

  // 1) Brand-new buyer: route by situation.
  if (savedDealCount === 0 && cases.length === 0) {
    push({
      id: "first-scan",
      title: "Start with your situation",
      body: "Have a deal, still shopping, or already signed? Pick your path and we'll route you.",
      href: "/",
      cta: "Find your path",
    });
  }

  // 2) Continue a recurring service that's in play.
  if (services.has("credit_to_keys")) {
    push({
      id: "continue-ctk",
      title: "Continue your Credit-to-Keys plan",
      body: "Pick up your prepare → qualify → buy pathway where you left off.",
      href: "/credit-to-keys",
      cta: "Open Credit-to-Keys",
    });
  }

  // 3) Has scans but no full quote review → upsell the deeper review.
  if (savedDealCount > 0 && !caseTypes.has("quote_review")) {
    push({
      id: "quote-review",
      title: "Have dealer paperwork?",
      body: "Turn a quick scan into a full quote review with a pushback script.",
      href: "/quote-review",
      cta: "Review my quote",
    });
  }

  // 4) Something delivered → know the market and cover the post-sale base.
  if (hasDelivered) {
    push({
      id: "market-check",
      title: "Check the market",
      body: "See how your price compares to real local listings before you commit.",
      href: "/market-check",
      cta: "Run a Market Check",
    });
    if (!caseTypes.has("deal_rescue")) {
      push({
        id: "post-sale",
        title: "Already signed?",
        body: "Map what may be cancellable, disputable, or worth escalating.",
        href: "/already-signed",
        cta: "Review my options",
      });
    }
  }

  // 5) Widen: market check is always a useful, low-commitment next step.
  push({
    id: "market-check",
    title: "Know a fair price",
    body: "Run a free Market Check on the vehicle you're considering.",
    href: "/market-check",
    cta: "Run a Market Check",
  });

  // 6) Fallback that's always available.
  push({
    id: "human-review",
    title: "Want a human advocate?",
    body: "Have a real advocate review your deal for a deeper second opinion.",
    href: "/human-review",
    cta: "Request human review",
  });

  return out.slice(0, limit);
}
