import { redirect } from "next/navigation";

// Buyer-language alias for the Concierge done-for-you path. Keeps the URL that
// matches how buyers describe it while the destination page stays /concierge.
export default function HandleItForMeAlias() {
  redirect("/concierge");
}
