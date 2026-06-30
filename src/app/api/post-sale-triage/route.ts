/**
 * POST /api/post-sale-triage — Already Signed → Post-Sale Triage.
 *
 * Pure-engine flow: normalize the intake and call buildPostSaleTriage (no market
 * lookup needed — this is about what was already signed). v1 persistence is
 * client-side, mirroring the other forward flows: we return the triage + a
 * generated id and the intake form saves it to the on-device workspace for the
 * /triage/[triageId] page to render.
 */
import { randomUUID } from "node:crypto";
import { postSaleSchema } from "@/lib/schemas";
import { buildPostSaleTriage } from "@/lib/post-sale-engine/buildPostSaleTriage";
import { apiError, apiOk } from "@/lib/api-response";
import type { PostSaleInput } from "@/lib/post-sale-engine/types";

export const runtime = "nodejs";

function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }
  return null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("invalid_json", "Invalid JSON body.");
  }

  const parsed = postSaleSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("validation", "That submission didn't look right. Please check your entries.");
  }
  const d = parsed.data;

  const input: PostSaleInput = {
    buyerState: str(d.buyerState),
    daysSinceSigned: num(d.daysSinceSigned),
    financed: d.financed ?? false,
    lienholder: str(d.lienholder),
    dealerName: str(d.dealerName),
    addOns: (d.addOns ?? [])
      .map((a) => ({ rawLabel: str(a.rawLabel) ?? "", amount: num(a.amount), financed: a.financed ?? false }))
      .filter((a) => a.rawLabel !== ""),
  };

  const result = buildPostSaleTriage(input);

  return apiOk({ triageId: randomUUID(), result, persisted: false });
}
