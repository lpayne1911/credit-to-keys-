/**
 * POST /api/console/operators/[id] — admin updates an operator (active / role).
 *
 * Admin-only. Guards against an admin removing their OWN access (deactivating or
 * demoting themselves), which would be an easy way to lock everyone out.
 */
import { getConsoleOperator } from "@/lib/console-auth";
import { updateOperator } from "@/lib/operators";
import { updateOperatorSchema } from "@/lib/schemas";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getConsoleOperator();
  if (!me) {
    return apiError("unauthorized", "Not authorized.");
  }
  if (me.role !== "admin") {
    return apiError("forbidden", "Admins only.");
  }

  const parsed = updateOperatorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("validation", "Provide active and/or role.", { status: 400 });
  }

  // Don't let an admin lock themselves out (deactivate or demote own row).
  if (params.id === me.id && (parsed.data.active === false || parsed.data.role === "reviewer")) {
    return apiError("conflict", "You can't deactivate or demote your own account.");
  }

  const result = await updateOperator(params.id, parsed.data);
  if (!result.ok) {
    return apiError("server_error", result.error);
  }
  return apiOk({ operator: result.operator });
}
