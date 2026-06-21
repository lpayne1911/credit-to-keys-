/**
 * POST /api/console/login — DELIBERATE V1 STOPGAP AUTH.
 * Single shared CONSOLE_PASSWORD → sets an httpOnly session cookie.
 * >>> REPLACE WITH PROPER AUTH BEFORE LAUNCH <<< (see lib/console-auth.ts)
 */
import { NextResponse } from "next/server";
import {
  passwordMatches,
  consoleCookieValue,
  isConsoleConfigured,
  CONSOLE_COOKIE,
} from "@/lib/console-auth";
import { loginSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  if (!isConsoleConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Console password isn't configured on the server." },
      { status: 503 },
    );
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const password = parsed.data.password;

  if (!passwordMatches(password)) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password." },
      { status: 401 },
    );
  }

  const value = consoleCookieValue();
  if (!value) {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CONSOLE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours — stopgap session length
  });
  return res;
}
