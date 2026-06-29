/**
 * POST /api/console/operators/[id] — admin updates an operator (active / role).
 *
 * Admin-only. Guards against an admin removing their OWN access (deactivating or
 * demoting themselves), which would be an easy way to lock everyone out.
 */
import { NextResponse } from "next/server";
import { getConsoleOperator } from "@/lib/console-auth";
import { updateOperator } from "@/lib/operators";
import { updateOperatorSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getConsoleOperator();
  if (!me) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  if (me.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
  }

  const parsed = updateOperatorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Provide active and/or role." }, { status: 400 });
  }

  // Don't let an admin lock themselves out (deactivate or demote own row).
  if (params.id === me.id && (parsed.data.active === false || parsed.data.role === "reviewer")) {
    return NextResponse.json(
      { ok: false, error: "You can't deactivate or demote your own account." },
      { status: 409 },
    );
  }

  const result = await updateOperator(params.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, operator: result.operator });
}
