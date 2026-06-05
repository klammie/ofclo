// app/dashboard/user/feed/[username]/page.tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { user, profiles, creators, subscriptions, posts, likes, bookmarks } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { CreatorProfileDashboard } from "@/components/profile/CreatorProfileDashboard";

interface FeedProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function FeedProfilePage({ params }: FeedProfilePageProps) {
  const session      = await requireRole("user", "creator", "agency");
  const { username } = await params;

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const profileData = await db.execute<{
    user_id: string;
    name: string;
    username: string;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    location: string | null;
    website: string | null;
    created_at: Date;
    creator_id: string | null;
    is_verified: boolean;
    subscriber_count: number;
    post_count: number;
    standard_price: string | null;
    vip_price: string | null;
  }>(sql`
    SELECT
      u.id                                AS user_id,
      u.name,
      p.username,
      p.bio,
      p.avatar_url,
      p.cover_url,
      p.location,
      p.website,
      u.created_at,
      c.id                                AS creator_id,
      COALESCE(c.is_verified,      false) AS is_verified,
      COALESCE(c.subscriber_count, 0)     AS subscriber_count,
      COALESCE(c.post_count,       0)     AS post_count,
      c.standard_price,
      c.vip_price
    FROM ${profiles} p
    JOIN     ${user}     u ON p.id     = u.id
    LEFT JOIN ${creators} c ON u.id    = c.user_id
    WHERE p.username = ${username}
    LIMIT 1
  `);

  if (profileData.rows.length === 0) notFound();

  const profile      = profileData.rows[0];
  const isOwnProfile = session.user.id === profile.user_id;

  // ── Subscription check ────────────────────────────────────────────────────
  let isSubscribed: boolean = false;
  let subscriptionTier: "standard" | "vip" | null = null;

  if (profile.creator_id) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId,    session.user.id),
          eq(subscriptions.creatorId, profile.creator_id),
          eq(subscriptions.status,    "active"),
        )
      )
      .limit(1);

    if (sub) {
      isSubscribed     = true;
      subscriptionTier = sub.tier;
    }
  }

  // ── Posts ─────────────────────────────────────────────────────────────────
  let formattedPosts: {
    id: string;
    title: string | null;
    description: string | null;
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl: string | null;
    duration: number | null;          // ← video duration in seconds
    isLocked: boolean;
    ppvPrice: number | null;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    createdAt: Date;
    isLiked: boolean;
    isBookmarked: boolean;
  }[] = [];

  if (profile.creator_id) {
    const postsData = await db.execute<{
      id: string;
      title: string | null;
      description: string | null;
      media_type: string;
      media_url: string;
      thumbnail_url: string | null;
      duration: number | null;        // ← added
      is_locked: boolean;
      ppv_price: string | null;
      like_count: number | null;
      comment_count: number | null;
      view_count: number | null;
      created_at: Date;
      is_liked: boolean;
      is_bookmarked: boolean;
    }>(sql`
      SELECT
        p.id,
        p.title,
        p.description,
        p.media_type,
        p.media_url,
        p.thumbnail_url,
        p.duration,                                       -- ← added
        p.is_locked,
        p.ppv_price,
        COALESCE(p.like_count,    0) AS like_count,
        COALESCE(p.comment_count, 0) AS comment_count,
        COALESCE(p.view_count,    0) AS view_count,
        p.created_at,
        EXISTS(
          SELECT 1 FROM ${likes} l
          WHERE l.post_id = p.id
            AND l.user_id = ${session.user.id}
        ) AS is_liked,
        EXISTS(
          SELECT 1 FROM ${bookmarks} b
          WHERE b.post_id = p.id
            AND b.user_id = ${session.user.id}
        ) AS is_bookmarked
      FROM ${posts} p
      WHERE p.creator_id = ${profile.creator_id}
        AND p.status     = 'published'
        AND (
          p.is_locked = false
          OR ${isSubscribed} = true
        )
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    formattedPosts = postsData.rows.map((post) => ({
      id:           post.id,
      title:        post.title        ?? null,
      description:  post.description  ?? null,
      mediaType:    post.media_type,
      mediaUrl:     post.media_url,
      thumbnailUrl: post.thumbnail_url ?? null,
      duration:     post.duration != null ? Number(post.duration) : null, // ← mapped
      isLocked:     Boolean(post.is_locked),
      ppvPrice:     post.ppv_price    ? parseFloat(post.ppv_price) : null,
      likeCount:    Number(post.like_count    ?? 0),
      commentCount: Number(post.comment_count ?? 0),
      viewCount:    Number(post.view_count    ?? 0),
      createdAt:    post.created_at   ? new Date(post.created_at) : new Date(),
      isLiked:      Boolean(post.is_liked),
      isBookmarked: Boolean(post.is_bookmarked),
    }));
  }

  // ── Format profile ────────────────────────────────────────────────────────
  const profileFormatted = {
    userId:          profile.user_id,
    name:            profile.name,
    username:        profile.username,
    bio:             profile.bio            ?? null,
    avatarUrl:       profile.avatar_url     ?? null,
    coverUrl:        profile.cover_url      ?? null,
    location:        profile.location       ?? null,
    website:         profile.website        ?? null,
    joinedAt:        profile.created_at     ? new Date(profile.created_at) : new Date(),
    isVerified:      Boolean(profile.is_verified),
    subscriberCount: Number(profile.subscriber_count ?? 0),
    postCount:       Number(profile.post_count       ?? 0),
    isCreator:       !!profile.creator_id,
    creatorId:       profile.creator_id     ?? null,
    standardPrice:   profile.standard_price ? parseFloat(profile.standard_price) : null,
    vipPrice:        profile.vip_price      ? parseFloat(profile.vip_price)      : null,
  };

  return (
    <CreatorProfileDashboard
      profile={profileFormatted}
      posts={formattedPosts}
      isOwnProfile={isOwnProfile}
      isSubscribed={isSubscribed}
      subscriptionTier={subscriptionTier}
      currentUserId={session.user.id}
    />
  );
}