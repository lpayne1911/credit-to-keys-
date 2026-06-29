/**
 * Operator allowlist management (service-role, server only).
 *
 * The console's admin view uses these to invite operators by email, change
 * roles, and deactivate/reactivate access. All reads/writes go through the
 * service client because `operators` is RLS default-deny. Email is the allowlist
 * key and is always stored lower-cased.
 *
 * This file is SERVER ONLY.
 */

import { getServiceClient } from "./supabase/server";

export interface OperatorRow {
  id: string;
  email: string;
  role: "reviewer" | "admin";
  active: boolean;
  user_id: string | null;
  invited_by: string | null;
  created_at: string;
  linked_at: string | null;
}

const COLUMNS = "id, email, role, active, user_id, invited_by, created_at, linked_at";

/** All operators, newest first. Empty when Supabase isn't configured. */
export async function listOperators(): Promise<OperatorRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("operators")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as OperatorRow[];
}

export type OperatorMutationResult =
  | { ok: true; operator: OperatorRow }
  | { ok: false; error: string };

/** Invite (allowlist) an operator by email. Idempotent on email (reactivates). */
export async function addOperator(
  email: string,
  role: "reviewer" | "admin",
  invitedBy: string,
): Promise<OperatorMutationResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "Database not configured." };
  const normalized = email.trim().toLowerCase();

  // Upsert on the unique email so re-inviting a deactivated address re-enables it
  // rather than failing on the unique constraint.
  const { data, error } = await supabase
    .from("operators")
    .upsert(
      { email: normalized, role, active: true, invited_by: invitedBy },
      { onConflict: "email" },
    )
    .select(COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: "Could not add operator." };
  return { ok: true, operator: data as unknown as OperatorRow };
}

/** Update an operator's active flag and/or role by id. */
export async function updateOperator(
  id: string,
  patch: { active?: boolean; role?: "reviewer" | "admin" },
): Promise<OperatorMutationResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "Database not configured." };
  const update: Record<string, unknown> = {};
  if (typeof patch.active === "boolean") update.active = patch.active;
  if (patch.role) update.role = patch.role;
  if (Object.keys(update).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }
  const { data, error } = await supabase
    .from("operators")
    .update(update)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: "Could not update operator." };
  return { ok: true, operator: data as unknown as OperatorRow };
}
