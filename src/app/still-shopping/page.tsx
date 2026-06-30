import { getJourney } from "@/lib/journeys";
import { JourneyPage } from "@/components/journey/JourneyPage";

export const metadata = {
  title: "I'm still shopping — Driveway Advocate",
  description:
    "Haven't committed yet? Run a Market Check, build a Target Deal Sheet, or get help so you know your numbers before you walk into the dealership.",
};

const journey = getJourney("still-shopping")!;

export default function StillShoppingPage() {
  return <JourneyPage journey={journey} />;
}
