// lib/queries/bookmarks.ts
import { db } from "@/db";
import { bookmarks, posts, creators, user, profiles, likes } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function getBookmarkedPosts(userId: string) {
  const bookmarkedPosts = await db.execute<{
    post_id: string;
    post_title: string | null;
    post_description: string | null;
    media_type: string;
    media_url: string;
    thumbnail_url: string | null;
    is_locked: boolean;
    ppv_price: string | null;
    like_count: number;
    comment_count: number;
    post_created_at: Date;
    is_liked: boolean;
    bookmarked_at: Date;
    creator_id: string;
    creator_name: string;
    creator_username: string;
    creator_avatar: string | null;
    is_verified: boolean;
  }>(sql`
    SELECT 
      p.id as post_id,
      p.title as post_title,
      p.description as post_description,
      p.media_type,
      p.media_url,
      p.thumbnail_url,
      p.is_locked,
      p.ppv_price,
      p.like_count,
      p.comment_count,
      p.created_at as post_created_at,
      EXISTS(
        SELECT 1 FROM ${likes} l 
        WHERE l.post_id = p.id AND l.user_id = ${userId}
      ) as is_liked,
      b.created_at as bookmarked_at,
      c.id as creator_id,
      u.name as creator_name,
      pr.username as creator_username,
      pr.avatar_url as creator_avatar,
      c.is_verified
    FROM ${bookmarks} b
    JOIN ${posts} p ON b.post_id = p.id
    JOIN ${creators} c ON p.creator_id = c.id
    JOIN ${user} u ON c.user_id = u.id
    LEFT JOIN ${profiles} pr ON u.id = pr.id
    WHERE b.user_id = ${userId}
    ORDER BY b.created_at DESC
  `);

  return bookmarkedPosts.rows.map(row => ({
    id: row.post_id,
    title: row.post_title,
    description: row.post_description,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    isLocked: row.is_locked,
    ppvPrice: row.ppv_price ? parseFloat(row.ppv_price) : null,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    createdAt: row.post_created_at,
    isLiked: row.is_liked,
    bookmarkedAt: row.bookmarked_at,
    creator: {
      id: row.creator_id,
      name: row.creator_name,
      username: row.creator_username,
      avatarUrl: row.creator_avatar,
      isVerified: row.is_verified,
    },
  }));
}

export async function isBookmarked(userId: string, postId: string): Promise<boolean> {
  const [result] = await db
    .select()
    .from(bookmarks)
    .where(sql`${bookmarks.userId} = ${userId} AND ${bookmarks.postId} = ${postId}`)
    .limit(1);

  return !!result;
}