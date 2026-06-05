// app/dashboard/agency/creators/[creatorId]/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { agencies, agencyCreators, creators, user, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CreatorManagementTabs } from "@/components/agency/CreatorManagementTabs";
import { getCreatorFullStats } from "@/lib/queries/agency";
import Link from "next/link";

export default async function ManageCreatorPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { user: agencyUser } = await requireRole("agency");
  const { creatorId } = await params;

  // Get agency
  const [agency] = await db
    .select()
    .from(agencies)
    .where(eq(agencies.userId, agencyUser.id))
    .limit(1);

  if (!agency) {
    redirect("/dashboard/agency");
  }

  // Verify agency manages this creator
  const [relationship] = await db
    .select()
    .from(agencyCreators)
    .where(
      and(
        eq(agencyCreators.agencyId, agency.id),
        eq(agencyCreators.creatorId, creatorId)
      )
    )
    .limit(1);

  if (!relationship) {
    redirect("/dashboard/agency");
  }

  // Get creator details
  const [creator] = await db
    .select({
      id: creators.id,
      userId: creators.userId,
      userName: user.name,
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
      isVerified: creators.isVerified,
      subscriberCount: creators.subscriberCount,
      postCount: creators.postCount,
      standardPrice: creators.standardPrice,
      vipPrice: creators.vipPrice,
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator) {
    redirect("/dashboard/agency");
  }

  // Get full stats
  const stats = await getCreatorFullStats(creatorId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                {creator.userName.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-white">{creator.userName}</h1>
              {creator.isVerified && (
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className="text-pink-400 font-semibold mb-3">@{creator.username || 'username'}</p>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-white font-bold">{creator.subscriberCount}</span>
                <span className="text-gray-400 ml-1">Subscribers</span>
              </div>
              <div>
                <span className="text-white font-bold">{creator.postCount}</span>
                <span className="text-gray-400 ml-1">Posts</span>
              </div>
              <div>
                <span className="text-white font-bold">${creator.standardPrice}</span>
                <span className="text-gray-400 ml-1">/ month</span>
              </div>
            </div>
          </div>

          {/* Quick Actions - ✅ FIXED: Changed button to Link */}
          <div className="flex gap-3">
            <Link
              href={`/${creator.username}`}
              target="_blank"
              className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
            >
              👁️ View Profile
            </Link>
          </div>
        </div>

        {/* Management Tabs */}
        <CreatorManagementTabs 
          creator={creator} 
          stats={stats}
          agencyId={agency.id}
        />
      </div>
    </div>
  );
}