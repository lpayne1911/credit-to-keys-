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
import { ensureCaseForDeal, ensureCaseForIntake } from "./cases";
import { serviceForIntakeProduct, titleForIntake } from "./intake-service-map";

export type ClaimResult =
  | { ok: true; id: string; alreadyOwned: boolean }
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

  return { ok: true, id: dealId, alreadyOwned };
}

/**
 * Idempotently claim an intake application for a user. Only an UNOWNED intake is
 * claimable; one already owned by another user is never reassigned. When the
 * intake maps to a service line, opens its engagement + case so it shows on the
 * dashboard.
 */
export async function claimIntakeForUser(
  intakeId: string,
  userId: string,
): Promise<ClaimResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const { data: row, error } = await supabase
    .from("product_intakes")
    .select("id, user_id, product_id, payload")
    .eq("id", intakeId)
    .maybeSingle();
  if (error || !row) return { ok: false, reason: "not_found" };

  const owner = (row as { user_id: string | null }).user_id;
  if (owner && owner !== userId) return { ok: false, reason: "owned_by_other" };
  const alreadyOwned = owner === userId;

  if (!owner) {
    const { data: upd } = await supabase
      .from("product_intakes")
      .update({ user_id: userId })
      .eq("id", intakeId)
      .is("user_id", null)
      .select("id")
      .maybeSingle();
    if (!upd) {
      // Lost the race — re-check the owner.
      const { data: re } = await supabase
        .from("product_intakes")
        .select("user_id")
        .eq("id", intakeId)
        .maybeSingle();
      const reOwner = (re as { user_id: string | null } | null)?.user_id;
      if (reOwner && reOwner !== userId) return { ok: false, reason: "owned_by_other" };
    }
  }

  const productId = (row as { product_id: string }).product_id;
  const service = serviceForIntakeProduct(productId);
  if (service) {
    await ensureCaseForIntake({
      userId,
      service,
      intakeId,
      title: titleForIntake(productId, (row as { payload: unknown }).payload),
    });
  }

  return { ok: true, id: intakeId, alreadyOwned };
}
