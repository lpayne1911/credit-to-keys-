/**
 * POST /api/console/operators — admin invites/allowlists an operator by email.
 *
 * Admin-only. The invited email can sign in later with password or a social
 * provider; they're linked to their auth user on first login. Idempotent on
 * email (re-inviting a deactivated address reactivates it).
 */
import { getConsoleOperator } from "@/lib/console-auth";
import { addOperator } from "@/lib/operators";
import { addOperatorSchema } from "@/lib/schemas";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const me = await getConsoleOperator();
  if (!me) {
    return apiError("unauthorized", "Not authorized.");
  }
  if (me.role !== "admin") {
    return apiError("forbidden", "Admins only.");
  }

  const parsed = addOperatorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("validation", "Enter a valid email and role.", { status: 400 });
  }

  const result = await addOperator(parsed.data.email, parsed.data.role, me.email);
  if (!result.ok) {
    return apiError("server_error", result.error);
  }
  return apiOk({ operator: result.operator });
}
