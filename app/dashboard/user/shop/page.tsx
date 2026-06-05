import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ShopTab from "@/components/shop/ShopTab";

export default async function ShopPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <div className="w-full max-w-7xl mx-auto">
      <ShopTab />
    </div>
  );
}