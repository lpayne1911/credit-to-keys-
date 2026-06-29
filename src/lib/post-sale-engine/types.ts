/**
 * ============================================================================
 *  Post-Sale Engine — Already Signed / Post-Sale Triage
 * ============================================================================
 *
 * The buyer has already signed. This engine triages what they bought, flags
 * which add-on products are commonly cancellable (and which usually aren't),
 * maps who to contact, lists the documents to gather, and lays out an ordered
 * next-step plan with escalation routes.
 *
 * Hard honesty rules (post-sale is where false hope does real harm):
 *  - Most vehicle purchases have NO cooling-off / 3-day right to return. We say
 *    so plainly. What's often cancellable is the individual ADD-ON contracts.
 *  - Refund amounts depend on each provider's contract terms; we give a CEILING
 *    (what was paid), never a promised refund.
 *  - Decision support, not legal advice. Outcomes after signing aren't
 *    guaranteed.
 * ============================================================================
 */
import type { AddOnCategory } from "@/lib/add-on-engine/types";

/** How likely an add-on is to be cancellable for some refund after signing. */
export type CancelOutlook = "often_refundable" | "unlikely" | "unknown";

export interface RawSignedAddOn {
  rawLabel: string;
  amount: number | null;
  financed: boolean;
}

export interface PostSaleInput {
  buyerState: string | null;
  /** Whole days since signing, when known. */
  daysSinceSigned: number | null;
  financed: boolean;
  lienholder: string | null;
  dealerName: string | null;
  addOns: RawSignedAddOn[];
}

export interface AddOnTriage {
  rawLabel: string;
  category: AddOnCategory;
  amount: number;
  financedIntoLoan: boolean;
  outlook: CancelOutlook;
  /** What the refund is typically based on (prorated, none, etc.). */
  refundBasis: string;
  whoToContact: string;
  howToStart: string;
}

export interface Contact {
  who: string;
  why: string;
  how: string;
  /** Escalation contacts render distinctly from your first-line contacts. */
  escalation: boolean;
}

export interface TriageStep {
  n: number;
  title: string;
  detail: string;
  timing?: string;
}

export interface PostSaleTriageResult {
  /** Brands the payload so a result page never mis-reads another shape. */
  schemaVersion: "post-sale-1";
  signedContext: {
    state: string | null;
    daysSinceSigned: number | null;
    financed: boolean;
  };
  summary: string;
  /** The no-cooling-off reality, stated up front. */
  coolingOffNote: string;
  addOns: AddOnTriage[];
  cancellableCount: number;
  /** Sum of amounts for often-refundable products — a CEILING, not a promise. */
  estimatedRefundCeiling: number | null;
  contacts: Contact[];
  documents: string[];
  plan: TriageStep[];
  disclaimers: string[];
}
