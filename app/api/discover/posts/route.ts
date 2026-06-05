/**
 * app/api/discover/posts/route.ts
 *
 * Fetches published posts from active creators for the explore grid.
 * Uses your exact schema: posts, creators, user, profiles, subscriptions,
 * likes, bookmarks tables.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  posts,
  creators,
  user,
  profiles,
  subscriptions,
  likes,
  bookmarks,
} from "@/db/schema";
import { eq, and, ne, desc, inArray, sql } from "drizzle-orm";

function getRarity(n: number) {
  if (n >= 10000) return "legendary";
  if (n >= 1000)  return "epic";
  if (n >= 100)   return "rare";
  return "common";
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "18"), 50);
  const page     = parseInt(searchParams.get("page") ?? "0");
  const offset   = page * limit;

  try {
    // ── Step 1: Fetch published posts from active creators ───────────────────
    //
    // posts.creatorId  → uuid (creators.id)
    // posts.status     → "published"
    // posts.isLocked   → boolean (blurred for non-subscribers)
    // posts.mediaUrl   → image/video URL
    // posts.mediaType  → "image" | "video"
    // posts.likeCount  → integer (cached)
    // posts.commentCount → integer (cached)

    const rawPosts = await db
      .select({
        postId:          posts.id,
        creatorId:       creators.id,           // uuid
        creatorUserId:   creators.userId,        // text (better-auth user id)
        mediaUrl:        posts.mediaUrl,
        mediaType:       posts.mediaType,
        thumbnailUrl:    posts.thumbnailUrl,
        caption:         posts.description,      // description = caption in your schema
        isLocked:        posts.isLocked,
        likeCount:       posts.likeCount,
        commentCount:    posts.commentCount,
        createdAt:       posts.createdAt,
        // Creator fields
        creatorName:     user.name,
        creatorImage:    user.image,
        creatorVerified: creators.isVerified,
        subscriberCount: creators.subscriberCount,
        // Profile fields (left join — may be null)
        username:        profiles.username,
        avatarUrl:       profiles.avatarUrl,
      })
      .from(posts)
      .innerJoin(creators, eq(creators.id,     posts.creatorId))
      .innerJoin(user,     eq(user.id,         creators.userId))
      .leftJoin(profiles,  eq(profiles.id,      creators.userId))
      .where(
        and(
          eq(posts.status,    "published"),
          eq(creators.status, "active"),
          // Exclude current user's own posts
          ne(creators.userId, session.user.id),
          // Search in caption/description
          search
            ? sql`${posts.description} ilike ${'%' + search + '%'}`
            : undefined,
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    if (rawPosts.length === 0) {
      return NextResponse.json({ posts: [], total: 0, hasMore: false });
    }

    const postIds    = rawPosts.map((p) => p.postId);
    const creatorIds = rawPosts.map((p) => p.creatorId);

    // ── Step 2: Which posts has the current user liked? ──────────────────────
    //
    // likes.userId  → text (better-auth user id)
    // likes.postId  → uuid (posts.id)

    const userLikes = postIds.length > 0
      ? await db
          .select({ postId: likes.postId })
          .from(likes)
          .where(and(eq(likes.userId, session.user.id), inArray(likes.postId, postIds)))
      : [];
    const likedSet = new Set(userLikes.map((l) => l.postId));

    // ── Step 3: Which posts has the current user bookmarked? ─────────────────
    //
    // bookmarks.userId → text
    // bookmarks.postId → uuid

    const userBookmarks = postIds.length > 0
      ? await db
          .select({ postId: bookmarks.postId })
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, session.user.id), inArray(bookmarks.postId, postIds)))
      : [];
    const bookmarkedSet = new Set(userBookmarks.map((b) => b.postId));

    // ── Step 4: Which creators is the current user subscribed to? ────────────
    //
    // subscriptions.userId    → text
    // subscriptions.creatorId → uuid
    // subscriptions.status    → "active"

    const activeSubs = creatorIds.length > 0
      ? await db
          .select({ creatorId: subscriptions.creatorId })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId,  session.user.id),
              eq(subscriptions.status,  "active"),
              inArray(subscriptions.creatorId, creatorIds),
            )
          )
      : [];
    const subscribedSet = new Set(activeSubs.map((s) => s.creatorId));

    // ── Step 5: Map to ExplorePost shape ─────────────────────────────────────

    const mappedPosts = rawPosts.map((row) => ({
      id:                row.postId,
      creatorId:         row.creatorId,
      creatorUserId:     row.creatorUserId,
      creatorName:       row.creatorName,
      creatorUsername:   row.username  ?? row.creatorName.toLowerCase().replace(/\s+/g, "_"),
      creatorAvatarUrl:  row.avatarUrl ?? row.creatorImage ?? null,
      creatorIsVerified: row.creatorVerified,
      creatorRarity:     getRarity(row.subscriberCount),
      isSubscribed:      subscribedSet.has(row.creatorId),
      mediaUrl:          row.mediaUrl,
      mediaType:         (row.mediaType as "image" | "video") ?? "image",
      thumbnailUrl:      row.thumbnailUrl ?? null,
      caption:           row.caption     ?? null,
      // If locked AND not subscribed → show blur
      isLocked:          row.isLocked && !subscribedSet.has(row.creatorId),
      likeCount:         row.likeCount    ?? 0,
      commentCount:      row.commentCount ?? 0,
      isLiked:           likedSet.has(row.postId),
      isBookmarked:      bookmarkedSet.has(row.postId),
      createdAt:         row.createdAt.toISOString(),
    }));

    return NextResponse.json({
      posts:   mappedPosts,
      total:   mappedPosts.length,
      hasMore: rawPosts.length === limit,
    });

  } catch (e) {
    console.error("[GET /api/discover/posts]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}