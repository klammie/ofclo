// app/dashboard/creator/overview/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { getCreatorOverviewStats } from "@/lib/queries/creator-overview";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CreatorOverviewDashboard } from "@/components/creator/CreatorOverviewDashboard";

export default async function CreatorOverviewPage() {
  const { user } = await requireRole("creator");

  // Get creator profile
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // Get all stats
  const stats = await getCreatorOverviewStats(creator.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            📊 Overview
          </h1>
          <p className="text-gray-400">
            Your performance at a glance
          </p>
        </div>

        <CreatorOverviewDashboard
          creatorId={creator.id}
          stats={stats}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Overview - FanVault Creator",
  description: "Creator dashboard overview",
};