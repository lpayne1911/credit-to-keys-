import { redirect } from "next/navigation";

// The Market Check report now lives inside the dashboard shell.
export default function MarketCheckRedirect() {
  redirect("/dashboard/market-check");
}
