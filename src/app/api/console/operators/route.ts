/**
 * POST /api/console/operators — admin invites/allowlists an operator by email.
 *
 * Admin-only. The invited email can sign in later with password or a social
 * provider; they're linked to their auth user on first login. Idempotent on
 * email (re-inviting a deactivated address reactivates it).
 */
import { NextResponse } from "next/server";
import { getConsoleOperator } from "@/lib/console-auth";
import { addOperator } from "@/lib/operators";
import { addOperatorSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const me = await getConsoleOperator();
  if (!me) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  if (me.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
  }

  const parsed = addOperatorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email and role." }, { status: 400 });
  }

  const result = await addOperator(parsed.data.email, parsed.data.role, me.email);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, operator: result.operator });
}
