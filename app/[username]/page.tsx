// app/[username]/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, profiles, creators } from "@/db/schema";
import { sql } from "drizzle-orm";
import { CreatorProfilePublic } from "@/components/profile/CreatorProfilePublic";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ✅ REDIRECT LOGGED-IN USERS TO DASHBOARD VERSION
  if (session?.user) {
    redirect(`/dashboard/user/feed/${username}`);
  }

  // Get profile for public view
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

  // Public users see limited posts (only public ones)
  const postsData = await db.execute<{
    id: string;
    title: string | null;
    description: string | null;
    media_type: string;
    media_url: string;
    thumbnail_url: string | null;
    is_locked: boolean;
    ppv_price: string | null;
    like_count: number;
    comment_count: number;
    created_at: Date;
  }>(sql`
    SELECT 
      p.id,
      p.title,
      p.description,
      p.media_type,
      p.media_url,
      p.thumbnail_url,
      p.is_locked,
      p.ppv_price,
      p.like_count,
      p.comment_count,
      p.created_at
    FROM posts p
    WHERE p.creator_id = ${profile.creator_id}
      AND p.is_locked = false
    ORDER BY p.created_at DESC
    LIMIT 10
  `);

  const formattedPosts = postsData.rows.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description,
    mediaType: post.media_type,
    mediaUrl: post.media_url,
    thumbnailUrl: post.thumbnail_url,
    isLocked: post.is_locked,
    ppvPrice: post.ppv_price ? parseFloat(post.ppv_price) : null,
    likeCount: post.like_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    isLiked: false,
  }));

  return (
    <CreatorProfilePublic
      profile={profileFormatted}
      posts={formattedPosts}
      isOwnProfile={false}
      isSubscribed={false}
      subscriptionTier={null}
      currentUserId={null}
    />
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  
  const profileData = await db.execute<{
    name: string;
    bio: string | null;
  }>(sql`
    SELECT 
      u.name,
      p.bio
    FROM ${profiles} p
    JOIN ${user} u ON p.id = u.id
    WHERE p.username = ${username}
  `);

  if (profileData.rows.length === 0) {
    return { title: "Profile Not Found" };
  }

  const profile = profileData.rows[0];

  return {
    title: `${profile.name} (@${username}) - FanVault`,
    description: profile.bio || `Check out ${profile.name}'s profile on FanVault`,
  };
}