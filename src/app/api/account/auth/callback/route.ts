/**
 * GET /api/account/auth/callback — buyer OAuth / email-confirmation return URL.
 * Exchanges the code for a session (sets cookies), optionally claims an
 * anonymous deal threaded via `claimDealId`, then sends the buyer to a safe
 * `redirectTo` (default the dashboard).
 */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/ssr";
import { getBuyer } from "@/lib/buyer-auth";
import { claimDealForUser, claimIntakeForUser, claimArtifactForUser } from "@/lib/claim";
import { safeRedirectPath, isUuid } from "@/lib/safe-redirect";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectTo = safeRedirectPath(url.searchParams.get("redirectTo"));
  const claimDealId = url.searchParams.get("claimDealId");
  const claimIntakeId = url.searchParams.get("claimIntakeId");
  const claimArtifactId = url.searchParams.get("claimArtifactId");

  const fail = () => {
    const dest = new URL("/login", url.origin);
    dest.searchParams.set("auth_error", "1");
    return NextResponse.redirect(dest);
  };

  if (!code) return fail();
  const supabase = getServerSupabase();
  if (!supabase) return fail();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail();

  // Best-effort claim of an anonymous deal/intake/artifact now that there's a session.
  if (isUuid(claimDealId) || isUuid(claimIntakeId) || isUuid(claimArtifactId)) {
    const buyer = await getBuyer();
    if (buyer && isUuid(claimDealId)) await claimDealForUser(claimDealId, buyer.id);
    if (buyer && isUuid(claimIntakeId)) await claimIntakeForUser(claimIntakeId, buyer.id);
    if (buyer && isUuid(claimArtifactId)) await claimArtifactForUser(claimArtifactId, buyer.id);
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
