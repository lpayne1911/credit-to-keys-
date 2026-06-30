import { AuthScreen } from "@/components/account/AuthScreen";

export const metadata = { title: "Create your account — Driveway Advocate" };
export const dynamic = "force-dynamic";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return <AuthScreen mode="signup" searchParams={searchParams} />;
}
