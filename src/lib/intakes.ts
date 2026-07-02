/**
 * Server-side data access for product_intakes (human-service requests: Build My
 * Plan, Concierge, Deal Rescue / post-sale, Human Review). Service-role client
 * (RLS-bypass) — SERVER ONLY, mirrors lib/deals.ts. Only the private operator
 * console lists these; buyers never see other buyers' intakes.
 */
import "server-only";
import { getServiceClient } from "./supabase/server";

export type ProductIntakeStatus = "review_requested" | "in_review" | "closed";

/** Row in `product_intakes` (see supabase/migrations/0003_product_intakes.sql). */
export interface ProductIntakeRow {
  id: string;
  product_id: string;
  payload: Record<string, unknown>;
  status: ProductIntakeStatus;
  created_at: string;
}

export async function listProductIntakes(): Promise<ProductIntakeRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("product_intakes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as ProductIntakeRow[];
}

export async function getProductIntakeById(
  id: string,
): Promise<ProductIntakeRow | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("product_intakes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProductIntakeRow;
}

/** Best-effort contact email out of the free-form intake payload. */
export function intakeContact(payload: Record<string, unknown>): string | null {
  const v = payload["contact"] ?? payload["email"];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Private-bucket paperwork path, when the buyer uploaded a document. */
export function intakeUploadPath(payload: Record<string, unknown>): string | null {
  const v = payload["uploadedFilePath"];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
