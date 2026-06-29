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

export default function BuildMyPlanPage() {
  return (
    <FunnelPage
      funnel={funnel}
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
