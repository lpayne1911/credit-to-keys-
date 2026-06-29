import { redirect } from "next/navigation";

// The homepage path chooser replaced the old products index. Redirect so any
// existing links land on the four-path picker.
export default function ProductsRedirect() {
  redirect("/");
}
