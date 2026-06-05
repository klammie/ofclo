// app/api/posts/[postId]/cancel-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { posts, creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const { postId } = await params;

    // Get post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify ownership
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, post.creatorId))
      .limit(1);

    if (!creator || creator.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Change to draft
    await db
      .update(posts)
      .set({
        status: "draft",
        scheduledFor: null,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    console.log(`[Post] Schedule cancelled: ${postId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Cancel Schedule] Error:", err);
    return NextResponse.json(
      { error: "Failed to cancel schedule" },
      { status: 500 }
    );
  }
}