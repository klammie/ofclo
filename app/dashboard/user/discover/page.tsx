import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ExploreGrid from "@/components/user/ExploreGrid";

export default async function DiscoverPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <div className="w-full max-w-6xl mx-auto">
      <ExploreGrid currentUserId={session.user.id} />
    </div>
  );
}