import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { likes, posts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { session, error } = await assertRole(req, "user", "creator", "agency");
  if (error) return error;

  const { postId } = await params;

  // Check if already liked
  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, session.user.id), eq(likes.postId, postId)))
    .limit(1);

  if (existing) {
    // Unlike
    await db.delete(likes).where(eq(likes.id, existing.id));
    await db.update(posts).set({ likeCount: sql`like_count - 1` }).where(eq(posts.id, postId));
    
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await db.insert(likes).values({ userId: session.user.id, postId });
    await db.update(posts).set({ likeCount: sql`like_count + 1` }).where(eq(posts.id, postId));
    
    return NextResponse.json({ liked: true });
  }
}