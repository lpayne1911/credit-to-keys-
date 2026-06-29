import { getFunnel } from "@/lib/funnels";
import { FunnelPage } from "@/components/funnels/FunnelPage";
import { ConciergeTimelineSample } from "@/components/funnels/samples";
import { FunnelIntake } from "@/components/funnels/FunnelIntake";

export const metadata = {
  title: "Concierge — We Handle It | Driveway Advocate",
  description:
    "Your personal buyer advocate, from start to keys. We source, negotiate, review paperwork, and coordinate delivery. Application-based, buyer-side only.",
};

const funnel = getFunnel("concierge")!;

export default function ConciergePage() {
  return (
    <FunnelPage
      funnel={funnel}
      sample={<ConciergeTimelineSample />}
      intake={
        <FunnelIntake
          productId="concierge"
          accent="gold"
          cta="Apply Now"
          heading="Apply for Concierge"
          blurb="Tell us what you're looking for. We'll set up a discovery call to confirm scope, timeline, and a flat fee before any work begins."
        />
      }
    />
  );
}
