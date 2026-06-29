/**
 * Server-side data access for the engagements + cases spine. Uses the
 * service-role client (RLS-bypass), so this module is SERVER ONLY.
 *
 * Cases MIRROR the legacy deal lifecycle (see docs/PRODUCT-ARCHITECTURE.md §4–§5);
 * they reference a deal/intake and carry the canonical CaseStatus. They do not
 * replace deals.status.
 */
import "server-only";
import { getServiceClient } from "./supabase/server";
import { isDealReviewResult } from "./deal-engine/is-deal-review";
import type { CaseRow, CaseStatus, DealRow, EngagementRow, EngagementService } from "./types";

/** Map the legacy deal lifecycle onto the canonical case taxonomy. Pure. */
export function caseStatusFromDeal(deal: Pick<DealRow, "status">): CaseStatus {
  switch (deal.status) {
    case "new":
      return "scanned";
    case "review_requested":
      return "review_requested";
    case "in_review":
      return "in_review";
    case "reviewed":
      return "delivered";
    case "archived":
      return "closed";
    default:
      return "scanned";
  }
}

/** Which service line a deal belongs to (Quote Review vs Deal Check). Pure. */
export function serviceForDeal(deal: { auto_result: unknown }): EngagementService {
  return isDealReviewResult(deal.auto_result) ? "quote_review" : "deal_check";
}

export async function listEngagementsForUser(userId: string): Promise<EngagementRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("engagements")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as EngagementRow[];
}

export async function listCasesForUser(userId: string): Promise<CaseRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as CaseRow[];
}

export async function getCaseById(id: string): Promise<CaseRow | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("cases").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as CaseRow;
}

/** The deal fields needed to open/refresh a case. */
type DealForCase = {
  id: string;
  user_id: string | null;
  status: DealRow["status"];
  auto_result: unknown;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
};

/**
 * Idempotently ensure an engagement + case exist for a signed-in buyer's deal.
 * Called from the deal-creation routes. Safe to call repeatedly: the engagement
 * is unique per (user, service) and a case is unique per deal.
 */
export async function ensureCaseForDeal(deal: DealForCase): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase || !deal.user_id) return;

  const service = serviceForDeal(deal);

  // Upsert the engagement (unique on user_id+service) and get its id.
  const { data: engagement } = await supabase
    .from("engagements")
    .upsert({ user_id: deal.user_id, service }, { onConflict: "user_id,service" })
    .select("id")
    .single();
  if (!engagement) return;

  const title =
    [deal.vehicle_year, deal.vehicle_make, deal.vehicle_model].filter(Boolean).join(" ") ||
    "Your deal";

  // Insert the case if one doesn't already exist for this deal (unique index).
  await supabase.from("cases").upsert(
    {
      engagement_id: engagement.id,
      user_id: deal.user_id,
      type: service,
      status: caseStatusFromDeal(deal),
      deal_id: deal.id,
      title,
    },
    { onConflict: "deal_id" },
  );
}
