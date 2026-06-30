import { getJourney } from "@/lib/journeys";
import { JourneyPage } from "@/components/journey/JourneyPage";

export const metadata = {
  title: "I already signed — Driveway Advocate",
  description:
    "Already signed and something feels wrong? Upload your paperwork for a post-sale options map covering what may be cancellable, disputable, or worth escalating.",
};

const journey = getJourney("already-signed")!;

export default function AlreadySignedPage() {
  return <JourneyPage journey={journey} />;
}
