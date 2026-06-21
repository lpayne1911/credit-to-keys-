import { GamifiedDealCheck } from "@/components/GamifiedDealCheck";

export const metadata = {
  title: "Check my deal — Driveway Advocate",
};

// Full-screen, app-like flow: no site header/footer chrome here — the
// component renders its own minimal top bar, progress, and sticky CTA.
export default function CheckPage() {
  return <GamifiedDealCheck />;
}
