// app/dashboard/creator/campaigns/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators, campaigns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CampaignsList } from "@/components/campaigns/CampaignsList";
import Link from "next/link";

export default async function CreatorCampaignsPage() {
  const { user } = await requireRole("creator");

  // Get creator
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // Get campaigns
  const creatorCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.creatorId, creator.id))
    .orderBy(desc(campaigns.createdAt));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              🎯 Campaigns
            </h1>
            <p className="text-gray-400">
              Set goals and receive support from your fans
            </p>
          </div>
          <Link
            href="/dashboard/creator/campaigns/create"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            + Create Campaign
          </Link>
        </div>

        <CampaignsList campaigns={creatorCampaigns} isCreator={true} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Campaigns - FanVault Creator",
  description: "Manage your campaigns and goals",
};