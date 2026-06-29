/**
 * POST /api/console/deals/[id]/publish — operator publishes a reviewed verdict.
 *
 * Auth: an authenticated, active operator (see lib/console-auth.ts). Server-side
 * service-role write, attributed to the operator in `review_audit`.
 *
 * COMPLIANCE — ADVANCE-FEE RULE (CROA / TSR): publishing the reviewed verdict
 * IS the delivery of the service. If/when a paid review is introduced, the
 * customer may only be charged AT or AFTER this publish step — never before.
 * This route is the enforcement seam for that rule, and the audit row is the
 * timestamped proof of when delivery happened.
 */
import { NextResponse } from "next/server";
import { getConsoleOperator } from "@/lib/console-auth";
import { getServiceClient } from "@/lib/supabase/server";
import type { Flag } from "@/lib/fairness-engine";
import { publishSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const operator = await getConsoleOperator();
  if (!operator) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Database not configured." },
      { status: 503 },
    );
  }

  const parsed = publishSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid review payload." },
      { status: 422 },
    );
  }
  const body = parsed.data;
  const flags = body.flags as Flag[];

  const { error } = await supabase
    .from("deals")
    .update({
      reviewed_verdict: body.verdict,
      reviewed_headline: body.headline ?? null,
      reviewed_flags: flags,
      reviewed_at: new Date().toISOString(),
      status: "reviewed",
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Could not publish the review." },
      { status: 500 },
    );
  }

  // Refresh normalized findings: drop prior reviewed rows, insert the new set.
  await supabase
    .from("findings")
    .delete()
    .eq("deal_id", params.id)
    .eq("source", "reviewed");
  if (flags.length) {
    await supabase.from("findings").insert(
      flags.map((f) => ({
        deal_id: params.id,
        type: f.type,
        severity: f.severity,
        title: f.title,
        explanation: f.explanation,
        source: "reviewed" as const,
      })),
    );
  }

  // Audit: attribute the publish to the operator (who delivered what, when).
  await supabase.from("review_audit").insert({
    deal_id: params.id,
    operator: operator.userId,
    operator_email: operator.email,
    action: "publish_review",
    verdict: body.verdict,
  });

  return NextResponse.json({ ok: true });
}
