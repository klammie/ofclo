// app/api/posts/[postId]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { comments, posts, user, profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { session, error } = await assertRole(req, "user", "creator", "agency");
  if (error) return error;

  const { postId } = await params;
  const { content } = await req.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  // Insert comment
  const [comment] = await db
    .insert(comments)
    .values({
      postId,
      userId: session.user.id,
      content: content.trim(),
    })
    .returning();

  // Update comment count
  await db
    .update(posts)
    .set({ commentCount: sql`comment_count + 1` })
    .where(eq(posts.id, postId));

  // ✅ GET USER DATA - This is what was missing!
  const userData = await db.execute<{
    user_name: string;
    username: string;
    avatar_url: string | null;
  }>(sql`
    SELECT 
      u.name as user_name,
      COALESCE(p.username, SPLIT_PART(u.email, '@', 1)) as username,
      p.avatar_url
    FROM ${user} u
    LEFT JOIN ${profiles} p ON u.id = p.id
    WHERE u.id = ${session.user.id}
  `);

  const userInfo = userData.rows[0];

  // ✅ Return comment with full user data
  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      created_at: comment.createdAt,
      user_name: userInfo.user_name,
      username: userInfo.username,
      avatar_url: userInfo.avatar_url,
    }
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  const commentsList = await db.execute<{
    id: string;
    content: string;
    created_at: Date;
    user_name: string;
    username: string;
    avatar_url: string | null;
  }>(sql`
    SELECT 
      c.id,
      c.content,
      c.created_at,
      u.name as user_name,
      COALESCE(p.username, SPLIT_PART(u.email, '@', 1)) as username,
      p.avatar_url
    FROM ${comments} c
    JOIN ${user} u ON c.user_id = u.id
    LEFT JOIN ${profiles} p ON u.id = p.id
    WHERE c.post_id = ${postId}
    ORDER BY c.created_at DESC
  `);

  return NextResponse.json({ comments: commentsList.rows });
}