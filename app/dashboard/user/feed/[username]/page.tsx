// app/dashboard/user/feed/[username]/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { user, profiles, creators, subscriptions, posts, likes } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { CreatorProfileDashboard } from "@/components/profile/CreatorProfileDashboard";

interface FeedProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function FeedProfilePage({ params }: FeedProfilePageProps) {
  const session = await requireRole("user", "creator", "agency");
  const { username } = await params;

  // Get profile with creator info
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
      u.id as user_id,
      u.name,
      p.username,
      p.bio,
      p.avatar_url,
      p.cover_url,
      p.location,
      p.website,
      u.created_at,
      c.id as creator_id,
      c.is_verified,
      c.subscriber_count,
      c.post_count,
      c.standard_price,
      c.vip_price
    FROM ${profiles} p
    JOIN ${user} u ON p.id = u.id
    LEFT JOIN ${creators} c ON u.id = c.user_id
    WHERE p.username = ${username}
  `);

  if (profileData.rows.length === 0) {
    notFound();
  }

  const profile = profileData.rows[0];
  const isOwnProfile = session.user.id === profile.user_id;

  // Check if subscribed
  let isSubscribed = false;
  let subscriptionTier: "standard" | "vip" | null = null;

  if (profile.creator_id) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.creatorId, profile.creator_id),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (sub) {
      isSubscribed = true;
      subscriptionTier = sub.tier;
    }
  }

  // Get posts
  const postsData = await db.execute<{
    id: string;
    title: string | null;
    description: string | null;
    content_type: string;
    media_url: string;
    thumbnail_url: string | null;
    is_locked: boolean;
    ppv_price: string | null;
    like_count: number;
    comment_count: number;
    created_at: Date;
    is_liked: boolean;
  }>(sql`
    SELECT 
      p.id,
      p.title,
      p.description,
      p.content_type,
      p.media_url,
      p.thumbnail_url,
      p.is_locked,
      p.ppv_price,
      p.like_count,
      p.comment_count,
      p.created_at,
      EXISTS(
        SELECT 1 FROM ${likes} l 
        WHERE l.post_id = p.id AND l.user_id = ${session.user.id}
      ) as is_liked
    FROM ${posts} p
    WHERE p.creator_id = ${profile.creator_id}
      AND (
        p.is_locked = false 
        OR ${isSubscribed}
      )
    ORDER BY p.created_at DESC
    LIMIT 20
  `);

  const profileFormatted = {
    userId: profile.user_id,
    name: profile.name,
    username: profile.username,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    coverUrl: profile.cover_url,
    location: profile.location,
    website: profile.website,
    joinedAt: profile.created_at,
    isVerified: profile.is_verified,
    subscriberCount: profile.subscriber_count,
    postCount: profile.post_count,
    isCreator: !!profile.creator_id,
    creatorId: profile.creator_id,
    standardPrice: profile.standard_price ? parseFloat(profile.standard_price) : null,
    vipPrice: profile.vip_price ? parseFloat(profile.vip_price) : null,
  };

  const formattedPosts = postsData.rows.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description,
    mediaType: post.content_type,
    mediaUrl: post.media_url,
    thumbnailUrl: post.thumbnail_url,
    isLocked: post.is_locked,
    ppvPrice: post.ppv_price ? parseFloat(post.ppv_price) : null,
    likeCount: post.like_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    isLiked: post.is_liked,
  }));

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