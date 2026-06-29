import { redirect } from "next/navigation";

// Post-signing help now lives at /post-sale-triage. Keep this route as a
// redirect so existing links and bookmarks don't break.
export default function DealRescueRedirect() {
  redirect("/post-sale-triage");
}
