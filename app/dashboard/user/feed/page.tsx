// app/dashboard/user/feed/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { getFeedPosts } from "@/lib/queries/feed";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { SuggestedCreatorsSidebar } from "@/components/feed/SuggestedCreatorFeed";
import { db } from "@/db";
import { creators, user, profiles, subscriptions } from "@/db/schema";
import { eq, and, ne, notInArray, sql } from "drizzle-orm";

// ─── Fetch suggested creators server-side ─────────────────────────────────────

async function getSuggestedCreators(userId: string) {
  try {
    const activeSubs = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));

    const subscribedIds = activeSubs.map((s) => s.creatorId);

    const rows = await db
      .select({
        creatorId:       creators.id,
        creatorUserId:   creators.userId,
        creatorName:     user.name,
        creatorImage:    user.image,
        creatorVerified: creators.isVerified,
        subscriberCount: creators.subscriberCount,
        postCount:       creators.postCount,
        standardPrice:   creators.standardPrice,
        bio:             creators.bio,
        username:        profiles.username,
        avatarUrl:       profiles.avatarUrl,
      })
      .from(creators)
      .innerJoin(user,    eq(user.id,      creators.userId))
      .leftJoin(profiles, eq(profiles.id,  creators.userId))
      .where(
        and(
          eq(creators.status, "active"),
          ne(creators.userId, userId),
          subscribedIds.length > 0
            ? notInArray(creators.id, subscribedIds)
            : sql`true`,
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(6);

    const getRarity = (n: number) =>
      n >= 10000 ? "legendary" : n >= 1000 ? "epic" : n >= 100 ? "rare" : "common";

    return rows.map((r) => ({
      id:              r.creatorId,
      userId:          r.creatorUserId,
      name:            r.creatorName,
      username:        r.username ?? r.creatorName.toLowerCase().replace(/\s+/g, "_"),
      avatarUrl:       r.avatarUrl ?? r.creatorImage ?? null,
      bio:             r.bio ?? null,
      isVerified:      r.creatorVerified,
      subscriberCount: r.subscriberCount,
      postCount:       r.postCount,
      standardPrice:   r.standardPrice,
      rarity:          getRarity(r.subscriberCount) as "common" | "rare" | "epic" | "legendary",
    }));
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user: sessionUser } = await requireRole("user", "creator", "agency");

  const params = await searchParams;
  const page   = parseInt(params.page ?? "1");

  const [posts, suggestedCreators] = await Promise.all([
    getFeedPosts(sessionUser.id, page, 20),
    getSuggestedCreators(sessionUser.id),
  ]);

  return (
    <div className="w-full" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div className="flex gap-6 max-w-6xl mx-auto">

        {/* ── Centre: feed ── */}
        <main className="flex-1 min-w-0">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-[24px] font-black text-[#f0eaff] leading-tight">Feed</h1>
            <p className="text-[13px] mt-1" style={{ color: "rgba(240,234,255,0.45)" }}>
              Latest posts from creators you follow
            </p>
          </div>

          <FeedGrid posts={posts} currentUserId={sessionUser.id} />
        </main>

        {/* ── Right: suggested creators sidebar ── */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-6">
            <SuggestedCreatorsSidebar
              initialCreators={suggestedCreators}
              currentUserId={sessionUser.id}
            />
          </div>
        </aside>

      </div>
    </div>
  );
}

export const metadata = {
  title: "Feed · Fanzluv",
  description: "Your personalized feed",
};