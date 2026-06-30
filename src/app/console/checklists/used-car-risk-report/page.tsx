import { ConsoleChecklistGate } from "@/components/checklists/ConsoleChecklistGate";
import { UsedCarRiskChecklist } from "@/components/checklists/UsedCarRiskChecklist";

export const metadata = {
  title: "Used-Car Risk Report — analyst checklist (operator) — Driveway Advocate",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function UsedCarRiskChecklistPage() {
  return (
    <ConsoleChecklistGate title="Used-Car Risk Report — analyst checklist">
      <UsedCarRiskChecklist />
    </ConsoleChecklistGate>
  );
}
