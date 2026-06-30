/**
 * Claim — attach an anonymous result to a signed-in buyer.
 *
 * Anonymous flows create rows with `user_id = null` (a capability URL is the
 * only handle). When the buyer creates an account, we "claim" that row: set its
 * user_id and open the engagement + case so it shows up on their dashboard.
 *
 * Security: we only claim a row that is currently UNOWNED (user_id is null). A
 * row already owned by someone else is never reassigned — guessing an id can't
 * steal another buyer's deal.
 *
 * SERVER ONLY (service-role client).
 */
import "server-only";
import { getServiceClient } from "./supabase/server";
import { getDealById } from "./deals";
import { ensureCaseForDeal } from "./cases";

export type ClaimResult =
  | { ok: true; dealId: string; alreadyOwned: boolean }
  | { ok: false; reason: "unconfigured" | "not_found" | "owned_by_other" };

/**
 * Idempotently claim a deal for a user. If the deal is already this user's, we
 * still ensure its case exists (self-heal). Returns a typed result so the API
 * route can map it to a status code.
 */
export async function claimDealForUser(
  dealId: string,
  userId: string,
): Promise<ClaimResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const existing = await getDealById(dealId);
  if (!existing) return { ok: false, reason: "not_found" };

  if (existing.user_id && existing.user_id !== userId) {
    return { ok: false, reason: "owned_by_other" };
  }

  const alreadyOwned = existing.user_id === userId;

  if (!existing.user_id) {
    // Conditional update guards against a race: only set user_id while still null.
    const { data, error } = await supabase
      .from("deals")
      .update({ user_id: userId })
      .eq("id", dealId)
      .is("user_id", null)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, reason: "not_found" };
    if (!data) {
      // Lost the race — someone claimed it first. Re-check the owner.
      const recheck = await getDealById(dealId);
      if (recheck?.user_id && recheck.user_id !== userId) {
        return { ok: false, reason: "owned_by_other" };
      }
    }
  }

  // Open/refresh the engagement + case (idempotent).
  await ensureCaseForDeal({
    id: existing.id,
    user_id: userId,
    status: existing.status,
    auto_result: existing.auto_result,
    vehicle_year: existing.vehicle_year,
    vehicle_make: existing.vehicle_make,
    vehicle_model: existing.vehicle_model,
  });

  return { ok: true, dealId, alreadyOwned };
}
