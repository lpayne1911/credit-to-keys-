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
import { getConsoleOperator } from "@/lib/console-auth";
import { getServiceClient } from "@/lib/supabase/server";
import type { Flag } from "@/lib/fairness-engine";
import { publishSchema } from "@/lib/schemas";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const operator = await getConsoleOperator();
  if (!operator) {
    return apiError("unauthorized", "Not authorized.");
  }
  const supabase = getServiceClient();
  if (!supabase) {
    return apiError("unavailable", "Database not configured.");
  }

  const parsed = publishSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("validation", "Invalid review payload.");
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
    return apiError("server_error", "Could not publish the review.");
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
    operator_id: operator.id,
    operator_email: operator.email,
    action: "publish_review",
    verdict: body.verdict,
  });

  return apiOk({});
}
