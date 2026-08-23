// app/[username]/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/db";
import { creators, profiles, user, subscriptions, posts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/guard";
import { CreatorProfileDashboard } from "@/components/profile/CreatorProfileDashboard";
import { getSuggestedCreators } from "@/lib/queries/suggested-creators";
import { SuggestedCreatorsSidebar } from "@/components/feed/SuggestedCreatorFeed";


export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // ── Look up profile by username ────────────────────────────────────────────
  const [profileRow] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profileRow) notFound();

  // ── Look up user ───────────────────────────────────────────────────────────
  const [userRow] = await db
    .select()
    .from(user)
    .where(eq(user.id, profileRow.id))
    .limit(1);

  if (!userRow) notFound();

  // ── Look up creator record ─────────────────────────────────────────────────
  const [creatorRow] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, userRow.id))
    .limit(1);

  if (!creatorRow) notFound();

  // ── Session ────────────────────────────────────────────────────────────────
  const session      = await getSession();
  const currentUserId = session?.user?.id ?? null;
  const isOwnProfile = currentUserId === userRow.id;

  // ── Subscription status ────────────────────────────────────────────────────
  let isSubscribed      = false;
  let subscriptionTier: "standard" | "vip" | null = null;

  if (currentUserId && !isOwnProfile) {
    const [sub] = await db
      .select({ tier: subscriptions.tier, status: subscriptions.status })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId,    currentUserId),
          eq(subscriptions.creatorId, creatorRow.id),
          eq(subscriptions.status,    "active"),
        )
      )
      .limit(1);

    if (sub) {
      isSubscribed     = true;
      subscriptionTier = sub.tier;
    }
  }

  // ── Posts ──────────────────────────────────────────────────────────────────
  const postRows = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.creatorId, creatorRow.id),
        eq(posts.status,    "published"),
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(30);

  // ── Suggested creators ─────────────────────────────────────────────────────
  const suggestedCreators = await getSuggestedCreators(
    currentUserId,
    userRow.id,  // exclude the creator being viewed
    8,
  );
  console.log("[creator-profile] suggestedCreators:", suggestedCreators.length);

  // ── Shape the profile prop ─────────────────────────────────────────────────
  const profile = {
    userId:          userRow.id,
    name:            userRow.name,
    username:        profileRow.username ?? username,
    bio:             profileRow.bio        ?? null,
    avatarUrl:       profileRow.avatarUrl  ?? null,
    coverUrl:        profileRow.coverUrl   ?? null,
    location:        profileRow.location   ?? null,
    website:         profileRow.website    ?? null,
    joinedAt:        userRow.createdAt,
    isVerified:      creatorRow.isVerified ?? false,
    subscriberCount: creatorRow.subscriberCount ?? 0,
    postCount:       creatorRow.postCount        ?? 0,
    standardPrice:   creatorRow.standardPrice != null
                       ? Number(creatorRow.standardPrice) / 100   // stored as cents
                       : null,
    vipPrice:        creatorRow.vipPrice != null
                       ? Number(creatorRow.vipPrice)              // stored as dollars
                       : null,
    isCreator:       true,
    creatorId:       creatorRow.id,
  };

  // ── Shape posts ────────────────────────────────────────────────────────────
  const shapedPosts = postRows.map((p) => ({
    id:           p.id,
    title:        p.title        ?? null,
    description:  p.description  ?? null,
    mediaType:    (p.mediaType   ?? "image") as "image" | "video",
    mediaUrl:     p.mediaUrl     ?? "",
    thumbnailUrl: p.thumbnailUrl ?? null,
    duration:     p.duration     ?? null,
    isLocked:     p.isLocked     ?? false,
    ppvPrice:     p.ppvPrice     ?? null,
    likeCount:    p.likeCount    ?? 0,
    commentCount: p.commentCount ?? 0,
    createdAt:    p.createdAt,
    isLiked:      false,
  }));

 // app/[username]/page.tsx
// Replace the return statement with this:

// app/[username]/page.tsx — update the return statement:


return (
  <div className="w-full" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
    <div className="flex gap-6 max-w-6xl mx-auto" style={{ alignItems: "flex-start" }}>

      {/* ── Main: creator profile ── */}
      <main className="flex-1 min-w-0">
        <CreatorProfileDashboard
          profile={profile}
          posts={shapedPosts}
          isOwnProfile={isOwnProfile}
          isSubscribed={isSubscribed}
          subscriptionTier={subscriptionTier}
          currentUserId={currentUserId}
        />
      </main>

      {/* ── Right: fixed sidebar — identical to feed page ── */}
      {suggestedCreators.length > 0 && (
      <aside className="hidden lg:block w-72 flex-shrink-0">
  <div
    style={{
      position:       "fixed",
      top:            "5rem",
      right:          "calc((100vw - 72rem - var(--sidebar-width, 256px)) / 2)",
      width:          "18rem",
      maxHeight:      "calc(100vh - 5.5rem)",
      overflowY:      "auto",
      scrollbarWidth: "none",
      transition:     "right 0.3s ease",  // matches sidebar animation
    }}
  >
    <SuggestedCreatorsSidebar
      initialCreators={suggestedCreators}
      currentUserId={currentUserId}
    />
  </div>
</aside>
      )}

    </div>
  </div>
);
}