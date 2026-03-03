// app/dashboard/creator/subscribers/page.tsx
// Creator subscribers management page

import { requireRole } from "@/lib/auth/guard";
import { getCreatorSubscribers, getCreatorStats } from "@/lib/queries/creator";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SubscribersList } from "@/components/creator/SubscribersList";
import { redirect } from "next/navigation";

export default async function CreatorSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tier?: string }>;  // ✅ Add Promise type
}) {
  const { user } = await requireRole("creator");

  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  const params = await searchParams;  // ✅ Await it
  const page = parseInt(params.page || "1");
  const tierFilter = params.tier as "all" | "standard" | "vip" | undefined;

  // Get subscribers
  const { subscribers, total } = await getCreatorSubscribers(
    creator.id,
    page,
    20,
    tierFilter
  );

  // Get stats
  const stats = await getCreatorStats(creator.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            👥 My Subscribers
          </h1>
          <p className="text-gray-400">
            Manage your subscribers and view their details
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Subscribers</div>
            <div className="text-white font-bold text-2xl">
              {stats.find(s => s.label === "Subscribers")?.value || "0"}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Standard Tier</div>
            <div className="text-white font-bold text-2xl">
              {subscribers.filter(s => s.tier === "standard").length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">VIP Tier</div>
            <div className="text-white font-bold text-2xl">
              {subscribers.filter(s => s.tier === "vip").length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Monthly Revenue</div>
            <div className="text-white font-bold text-2xl">
              {stats.find(s => s.label === "Monthly Revenue")?.value || "$0"}
            </div>
          </div>
        </div>

        {/* Subscribers List */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <SubscribersList
            subscribers={subscribers}
            total={total}
            currentPage={page}
            currentFilter={tierFilter || "all"}
          />
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "My Subscribers - FanVault Creator",
  description: "Manage your subscribers",
};