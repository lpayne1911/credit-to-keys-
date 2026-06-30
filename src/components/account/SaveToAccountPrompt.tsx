import Link from "next/link";
import { getBuyer } from "@/lib/buyer-auth";
import { ClaimButton } from "./ClaimButton";

/**
 * "Save this to your account" card for a result page. Works for any claimable
 * object (deal or saved artifact). Picks the right state:
 *  - anonymous + signed-in buyer  → one-click claim
 *  - anonymous + logged-out viewer → create-account / sign-in carrying the claim
 *  - already this buyer's object   → confirmation + dashboard link
 *  - owned by someone else         → nothing
 *
 * `claimParam` is the signup query key the auth flow reads (claimDealId or
 * claimArtifactId); `redirectTo` is where to land after auth (this result page).
 */
export async function SaveToAccountPrompt({
  id,
  ownerId,
  redirectTo,
  claimParam,
  label = "Save this report",
}: {
  id: string;
  ownerId: string | null;
  redirectTo: string;
  claimParam: "claimDealId" | "claimArtifactId";
  label?: string;
}) {
  const buyer = await getBuyer();
  const bodyKey = claimParam === "claimDealId" ? "dealId" : "artifactId";

  // Owned by this buyer → reassure + link to dashboard.
  if (ownerId && buyer && ownerId === buyer.id) {
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
  if (ownerId) return null;

  // Anonymous, signed-in buyer → one-click claim.
  if (buyer) {
    return (
      <div className="rounded-2xl border border-edge bg-white p-5 shadow-card">
        <p className="text-sm font-bold text-navy">{label}</p>
        <p className="mt-1 text-sm text-slate">Keep it in your dashboard to pick up later.</p>
        <div className="mt-3">
          <ClaimButton claimBody={{ [bodyKey]: id }} />
        </div>
      </div>
    );
  }

  // Anonymous, logged-out viewer → create account / sign in, carrying the claim.
  const claimQuery = `${claimParam}=${id}&redirectTo=${encodeURIComponent(redirectTo)}`;
  return (
    <div className="rounded-2xl border border-edge bg-white p-5 text-center shadow-card">
      <p className="text-sm font-bold text-navy">{label}</p>
      <p className="mt-1 text-sm text-slate">
        Create a free account and we&apos;ll keep this in your dashboard.
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
