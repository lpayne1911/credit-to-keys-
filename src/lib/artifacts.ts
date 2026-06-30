/**
 * Server-side data access for saved_artifacts (Build My Plan sheets + Post-Sale
 * triages). Uses the service-role client (RLS-bypass), so this module is SERVER
 * ONLY. A buyer reaches their own artifact by its unguessable id (capability
 * URL); ownership (user_id) is what surfaces it on their dashboard.
 */
import "server-only";
import { getServiceClient } from "./supabase/server";

export type ArtifactKind = "plan" | "triage";

export interface ArtifactRow {
  id: string;
  user_id: string | null;
  kind: ArtifactKind;
  title: string | null;
  payload: unknown;
  created_at: string;
}

/** Persist a result. Returns the new id, or null if storage isn't configured. */
export async function saveArtifact(input: {
  kind: ArtifactKind;
  payload: unknown;
  title?: string | null;
  userId?: string | null;
}): Promise<string | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("saved_artifacts")
    .insert({
      kind: input.kind,
      payload: input.payload,
      title: input.title ?? null,
      user_id: input.userId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as string;
}

export async function getArtifactById(id: string): Promise<ArtifactRow | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("saved_artifacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ArtifactRow;
}

/** A buyer's saved artifacts (newest first), optionally filtered by kind. */
export async function listArtifactsForUser(
  userId: string,
  kind?: ArtifactKind,
): Promise<ArtifactRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  let query = supabase
    .from("saved_artifacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (kind) query = query.eq("kind", kind);
  const { data } = await query;
  return (data ?? []) as ArtifactRow[];
}
