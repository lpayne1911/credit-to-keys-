import { redirect } from "next/navigation";

// The analyst checklist is an internal reviewer reference, not customer advice.
// It was relocated behind operator auth; this legacy path now redirects there so
// the methodology is no longer publicly crawlable. Non-operators hit the console
// login at the destination.
export const metadata = { robots: { index: false, follow: false } };

export default function AnalystChecklistRedirect() {
  redirect("/console/checklists/used-car-risk-report");
}
