import { ConsoleChecklistGate } from "@/components/checklists/ConsoleChecklistGate";
import { FiProductReviewChecklist } from "@/components/checklists/FiProductReviewChecklist";

export const metadata = {
  title: "F&I Review — analyst checklist (operator) — Driveway Advocate",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function FiProductReviewChecklistPage() {
  return (
    <ConsoleChecklistGate title="F&I Review — analyst checklist">
      <FiProductReviewChecklist />
    </ConsoleChecklistGate>
  );
}
