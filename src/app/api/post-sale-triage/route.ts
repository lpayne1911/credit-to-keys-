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
import { NextResponse } from "next/server";
import { getBuyer } from "@/lib/buyer-auth";
import { saveArtifact } from "@/lib/artifacts";
import { postSaleSchema } from "@/lib/schemas";
import { buildPostSaleTriage } from "@/lib/post-sale-engine/buildPostSaleTriage";
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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = postSaleSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That submission didn't look right. Please check your entries." },
      { status: 422 },
    );
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

  // Persist server-side so the triage is reachable from any device and can be
  // claimed to a dashboard; fall back to a client-only id when storage is off.
  const buyer = await getBuyer();
  const title = input.dealerName ? `Post-sale · ${input.dealerName}` : "Post-sale review";
  const id = await saveArtifact({ kind: "triage", payload: result, title, userId: buyer?.id ?? null });

  return NextResponse.json({
    triageId: id ?? randomUUID(),
    result,
    persisted: Boolean(id),
    owned: Boolean(id && buyer),
  });
}
