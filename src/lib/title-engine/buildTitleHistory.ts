/**
 * title-engine — buildTitleHistory
 *
 * The single entry point for the NMVTIS title layer. Given a VIN, fetches the
 * VinAudit title history and returns a normalized {@link TitleHistory}.
 *
 * Gated + REAL-OR-HIDDEN: returns null unless the lookup is enabled AND
 * configured AND the VIN is valid AND VinAudit returns a usable response. There
 * is deliberately no mock — a fabricated title record would be dangerous. This
 * makes exactly one paid VinAudit call, and only when explicitly enabled.
 */
import {
  fetchTitleHistory,
  isConfigured,
  isEnabled,
} from "@/lib/sources/vinaudit/connector";
import { parseTitleHistory } from "@/lib/sources/vinaudit/normalize";
import { looksLikeVin } from "@/lib/vin";
import type { TitleHistory } from "@/lib/sources/vinaudit/types";

export async function buildTitleHistory(
  vin: string | null | undefined,
): Promise<TitleHistory | null> {
  if (!vin || !looksLikeVin(vin) || !isEnabled() || !isConfigured()) return null;

  const raw = await fetchTitleHistory(vin);
  const data = parseTitleHistory(raw);
  if (!data) return null;

  return { ...data, source: { provider: "vinaudit", fetchedAt: new Date().toISOString() } };
}
