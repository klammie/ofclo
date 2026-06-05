import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import WalletDashboard from "@/components/wallet/WalletDashboard";

export default async function WalletPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <div className="w-full max-w-4xl mx-auto">
      <WalletDashboard />
    </div>
  );
}