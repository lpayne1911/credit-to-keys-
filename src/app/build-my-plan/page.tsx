import Link from "next/link";
import { getFunnel } from "@/lib/funnels";
import { FunnelPage } from "@/components/funnels/FunnelPage";
import { TargetDealSheetSample } from "@/components/funnels/samples";
import { FunnelIntake } from "@/components/funnels/FunnelIntake";

export const metadata = {
  title: "Build My Plan — Target Deal Sheet | Driveway Advocate",
  description:
    "For buyers still shopping: we build your target numbers, fee checklist, and negotiation game plan so you walk into the dealership prepared.",
};

const funnel = getFunnel("build-my-plan")!;

/** Pre-purchase readiness pointer — Credit-to-Keys lives BEFORE the purchase,
 *  under buyer readiness (never inside the post-sale Deal Rescue funnel). */
function CreditReadinessNotice() {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-blue/25 bg-blue-soft px-5 py-4 sm:flex-row sm:items-center">
      <p className="text-sm leading-relaxed text-ink">
        <span className="font-bold text-blue-dark">Not ready to shop yet?</span>{" "}
        If credit, approval, budget, or down payment is holding you back, prepare
        before you walk into the dealership.
      </p>
      <Link
        href="/credit-to-keys"
        className="shrink-0 text-sm font-bold text-blue-dark hover:underline"
      >
        Start Credit-to-Keys →
      </Link>
    </div>
  );
}

export default function BuildMyPlanPage() {
  return (
    <FunnelPage
      funnel={funnel}
      notice={<CreditReadinessNotice />}
      sample={<TargetDealSheetSample />}
      intake={
        <FunnelIntake
          productId="build-my-plan"
          accent="blue"
          cta="Build My Plan"
          heading="Start your plan"
          blurb="Tell us about the car you're after. We'll follow up to build your Target Deal Sheet™ and game plan."
        />
      }
    />
  );
}
