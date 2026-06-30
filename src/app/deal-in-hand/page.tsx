import { getJourney } from "@/lib/journeys";
import { JourneyPage } from "@/components/journey/JourneyPage";

export const metadata = {
  title: "I have a deal in front of me — Driveway Advocate",
  description:
    "Have a quote, buyer's order, or payment worksheet? Upload it for a full red-flag review and a plain-English pushback plan, or pick a focused check.",
};

const journey = getJourney("deal-in-hand")!;

export default function DealInHandPage() {
  return <JourneyPage journey={journey} />;
}
