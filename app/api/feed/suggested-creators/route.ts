// app/api/feed/route.ts

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
import { eq, and, desc, inArray, sql } from "drizzle-orm";

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
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "10"), 30);
  const cursor = searchParams.get("cursor") ?? null;

  try {
    // ── Step 1: Get subscribed creator IDs ────────────────────────────────────
    const activeSubs = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.status, "active"),
        )
      );

    if (activeSubs.length === 0) {
      return NextResponse.json({ posts: [], hasMore: false, cursor: null });
    }

    const creatorIds = activeSubs.map((s) => s.creatorId);

    // ── Step 2: Fetch posts ───────────────────────────────────────────────────
    // Use explicit aliases to avoid column name collisions between
    // the user table and any other joined table.
    const rawPosts = await db
      .select({
        // Post fields
        postId:          posts.id,
        mediaUrl:        posts.mediaUrl,
        mediaType:       posts.mediaType,
        thumbnailUrl:    posts.thumbnailUrl,
        caption:         posts.description,
        isLocked:        posts.isLocked,
        likeCount:       posts.likeCount,
        commentCount:    posts.commentCount,
        viewCount:       posts.viewCount,
        createdAt:       posts.createdAt,

        // Creator table fields
        creatorId:       creators.id,
        creatorUserId:   creators.userId,
        creatorVerified: creators.isVerified,
        subscriberCount: creators.subscriberCount,

        // user table — aliased explicitly to avoid collisions
        // IMPORTANT: drizzle returns these under the key name you give them
        userName:        user.name,
        userImage:       user.image,

        // profiles table (left join — may be null)
        profileUsername: profiles.username,
        profileAvatar:   profiles.avatarUrl,
      })
      .from(posts)
      .innerJoin(creators, eq(creators.id,    posts.creatorId))
      .innerJoin(user,     eq(user.id,        creators.userId))
     .leftJoin(profiles, eq(profiles.id, user.id))
      .where(
        and(
          inArray(posts.creatorId, creatorIds),
          eq(posts.status, "published"),
          cursor
            ? sql`${posts.createdAt} < ${new Date(cursor)}`
            : undefined,
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);

    const hasMore = rawPosts.length > limit;
    const page    = rawPosts.slice(0, limit);

    if (page.length === 0) {
      return NextResponse.json({ posts: [], hasMore: false, cursor: null });
    }

    const postIds = page.map((p) => p.postId);

    // ── Step 3: Likes + bookmarks ─────────────────────────────────────────────
    const [userLikes, userBookmarks] = await Promise.all([
      db.select({ postId: likes.postId }).from(likes)
        .where(and(eq(likes.userId, session.user.id), inArray(likes.postId, postIds))),
      db.select({ postId: bookmarks.postId }).from(bookmarks)
        .where(and(eq(bookmarks.userId, session.user.id), inArray(bookmarks.postId, postIds))),
    ]);

    const likedSet      = new Set(userLikes.map((l) => l.postId));
    const bookmarkedSet = new Set(userBookmarks.map((b) => b.postId));

    // ── Step 4: Map to FeedPost shape ─────────────────────────────────────────
   const mapped = page.map((r) => ({
  id:              r.postId,
  creator: {
    id:        r.creatorId,
    userId:    r.creatorUserId,
    name:      r.userName,
    username:  r.profileUsername
                 ?? r.userName.toLowerCase().replace(/\s+/g, "_"),
    avatarUrl: r.profileAvatar ?? r.userImage ?? null, // ✅ nested avatar
    isVerified: r.creatorVerified,
    rarity:     getRarity(r.subscriberCount),
    subscriberCount: r.subscriberCount,
  },

  mediaUrl:        r.mediaUrl,
  mediaType:       (r.mediaType ?? "image") as "image" | "video",
  thumbnailUrl:    r.thumbnailUrl ?? null,
  caption:         r.caption ?? null,
  isLocked:        false, // subscribed users always see full content

  likeCount:       r.likeCount ?? 0,
  commentCount:    r.commentCount ?? 0,
  viewCount:       r.viewCount ?? 0,
  isLiked:         likedSet.has(r.postId),
  isBookmarked:    bookmarkedSet.has(r.postId),
  createdAt:       r.createdAt.toISOString(),
}));


    const nextCursor = hasMore
      ? page[page.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({ posts: mapped, hasMore, cursor: nextCursor });

  } catch (e: any) {
    console.error("[GET /api/feed]", e?.message ?? e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}