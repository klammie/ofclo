import { db } from "@/db";
import { posts, subscriptions, creators, user, profiles, likes, comments } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export async function getFeedPosts(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const results = await db.execute<{
    post_id: string;
    creator_id: string;
    creator_name: string;
    creator_username: string;
    creator_avatar: string | null;
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
      p.id as post_id,
      c.id as creator_id,
      u.name as creator_name,
      COALESCE(pr.username, SPLIT_PART(u.email, '@', 1)) as creator_username,
      pr.avatar_url as creator_avatar,
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
        SELECT 1 FROM likes l 
        WHERE l.post_id = p.id AND l.user_id = ${userId}
      ) as is_liked
    FROM ${posts} p
    JOIN ${creators} c ON p.creator_id = c.id
    JOIN ${subscriptions} s ON c.id = s.creator_id
    JOIN ${user} u ON c.user_id = u.id
    LEFT JOIN ${profiles} pr ON u.id = pr.id
    WHERE s.user_id = ${userId}
      AND s.status = 'active'
    ORDER BY p.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return results.rows.map(row => ({
    id: row.post_id,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    creatorUsername: row.creator_username,
    creatorAvatar: row.creator_avatar,
    title: row.title,
    description: row.description,
    mediaType: row.content_type,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    isLocked: row.is_locked,
    ppvPrice: row.ppv_price ? parseFloat(row.ppv_price) : null,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    isLiked: row.is_liked,
  }));
}