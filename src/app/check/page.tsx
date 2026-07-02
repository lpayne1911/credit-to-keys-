import { GamifiedDealCheck } from "@/components/GamifiedDealCheck";

export const metadata = {
  title: "Free Red Flag Scan — Driveway Advocate",
  description:
    "A fast, free scan of your car deal for the red flags buyers miss. No signup, about a minute — then upgrade to a full Quote Review for the line-by-line paperwork teardown.",
};

// Full-screen, app-like flow: no site header/footer chrome here — the
// component renders its own minimal top bar, progress, and sticky CTA.
export default function CheckPage() {
  return <GamifiedDealCheck />;
}
