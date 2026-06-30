import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountAuth } from "./AccountAuth";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { safeRedirectPath, isUuid } from "@/lib/safe-redirect";

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/**
 * Full-page sign-in / sign-up screen behind /login and /signup. Reads the claim
 * loop's query params (redirectTo, claimDealId), sanitizes them, and hands them
 * to AccountAuth. Cross-links between the two modes preserve the params so the
 * claim survives a mode switch.
 */
export function AuthScreen({
  mode,
  searchParams,
}: {
  mode: "signin" | "signup";
  searchParams: SearchParams;
}) {
  const redirectTo = safeRedirectPath(str(searchParams.redirectTo));
  const claimDealRaw = str(searchParams.claimDealId);
  const claimDealId = isUuid(claimDealRaw) ? claimDealRaw : undefined;
  const claimIntakeRaw = str(searchParams.claimIntakeId);
  const claimIntakeId = isUuid(claimIntakeRaw) ? claimIntakeRaw : undefined;
  const authError = str(searchParams.auth_error) === "1";

  // Preserve the claim params when linking to the other mode.
  const qs = new URLSearchParams();
  if (redirectTo !== "/dashboard") qs.set("redirectTo", redirectTo);
  if (claimDealId) qs.set("claimDealId", claimDealId);
  if (claimIntakeId) qs.set("claimIntakeId", claimIntakeId);
  const claiming = Boolean(claimDealId || claimIntakeId);
  const otherHref = `${mode === "signin" ? "/signup" : "/login"}${qs.toString() ? `?${qs}` : ""}`;

  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:py-20">
          {claiming && (
            <div className="mb-5 w-full rounded-xl border border-green/30 bg-green-soft px-4 py-3 text-center">
              <p className="text-sm font-semibold text-green-dark">
                Create a free account to save this
              </p>
              <p className="mt-0.5 text-xs text-green-dark/80">
                We&apos;ll keep it in your dashboard so you can pick up where you left off.
              </p>
            </div>
          )}

          {authError && (
            <div className="mb-5 w-full rounded-xl border border-verdict-red/30 bg-verdict-red/5 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-verdict-red">
                That sign-in link didn&apos;t work. Try again below.
              </p>
            </div>
          )}

          <AccountAuth
            configured={isBuyerAuthConfigured()}
            initialMode={mode}
            redirectTo={redirectTo}
            claimDealId={claimDealId}
            claimIntakeId={claimIntakeId}
          />

          <p className="mt-6 text-center text-sm text-slate">
            {mode === "signin" ? "New to Driveway Advocate?" : "Already have an account?"}{" "}
            <Link href={otherHref} className="font-semibold text-navy hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
