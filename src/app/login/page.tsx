import { AuthScreen } from "@/components/account/AuthScreen";

export const metadata = { title: "Sign in — Driveway Advocate" };
export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return <AuthScreen mode="signin" searchParams={searchParams} />;
}
