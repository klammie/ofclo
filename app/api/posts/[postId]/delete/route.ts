// app/api/posts/[postId]/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { posts, creators, agencies, agencyCreators } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { session, error } = await assertRole(req, "agency", "creator");
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

    // Verify permission (creator owns it OR agency manages the creator)
    if (session.user.role === "agency") {
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.userId, session.user.id))
        .limit(1);

      if (!agency) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const [relationship] = await db
        .select()
        .from(agencyCreators)
        .where(
          and(
            eq(agencyCreators.agencyId, agency.id),
            eq(agencyCreators.creatorId, post.creatorId)
          )
        )
        .limit(1);

      if (!relationship) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "creator") {
      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.userId, session.user.id))
        .limit(1);

      if (!creator || creator.id !== post.creatorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Delete post
    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Delete Post] Error:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}