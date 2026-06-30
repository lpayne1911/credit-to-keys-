import Link from "next/link";
import { getBuyer } from "@/lib/buyer-auth";
import { ClaimButton } from "./ClaimButton";

/**
 * "Save this to your account" card for a result page. Picks the right state:
 *  - anonymous deal + signed-in buyer  → one-click claim
 *  - anonymous deal + logged-out viewer → create-account / sign-in with claim params
 *  - already this buyer's deal          → confirmation + dashboard link
 *  - owned by someone else              → nothing
 *
 * `redirectTo` is where to land after auth (usually this result page).
 */
export async function SaveToAccountPrompt({
  dealId,
  dealUserId,
  redirectTo,
}: {
  dealId: string;
  dealUserId: string | null;
  redirectTo: string;
}) {
  const buyer = await getBuyer();

  // Owned by this buyer → reassure + link to dashboard.
  if (dealUserId && buyer && dealUserId === buyer.id) {
    return (
      <div className="rounded-2xl border border-edge bg-white p-4 text-center shadow-card">
        <p className="text-sm font-semibold text-navy">Saved to your account ✓</p>
        <Link href="/dashboard" className="mt-1 inline-block text-sm font-semibold text-green-dark hover:underline">
          View in your dashboard →
        </Link>
      </div>
    );
  }

  // Owned by someone else → don't offer to claim.
  if (dealUserId) return null;

  // Anonymous deal, signed-in buyer → one-click claim.
  if (buyer) {
    return (
      <div className="rounded-2xl border border-edge bg-white p-5 shadow-card">
        <p className="text-sm font-bold text-navy">Save this report</p>
        <p className="mt-1 text-sm text-slate">Keep it in your dashboard to pick up later.</p>
        <div className="mt-3">
          <ClaimButton dealId={dealId} />
        </div>
      </div>
    );
  }

  // Anonymous deal, logged-out viewer → create account / sign in, carrying the claim.
  const claimQuery = `claimDealId=${dealId}&redirectTo=${encodeURIComponent(redirectTo)}`;
  return (
    <div className="rounded-2xl border border-edge bg-white p-5 text-center shadow-card">
      <p className="text-sm font-bold text-navy">Save this report</p>
      <p className="mt-1 text-sm text-slate">
        Create a free account and we&apos;ll keep this deal in your dashboard.
      </p>
      <Link href={`/signup?${claimQuery}`} className="btn-primary mt-3 w-full">
        Create a free account
      </Link>
      <Link
        href={`/login?${claimQuery}`}
        className="mt-2 inline-block text-sm font-semibold text-navy hover:underline"
      >
        or sign in
      </Link>
    </div>
  );
}
