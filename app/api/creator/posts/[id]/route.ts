// app/api/creator/posts/[id]/route.ts
// Update and delete individual posts

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { posts, creators } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { deleteBlob } from "@/lib/azure";

// ══════════════════════════════════════════════════════════════════════════════
// DELETE POST
// ══════════════════════════════════════════════════════════════════════════════

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is a Promise
) {
  const { session, error } = await assertRole(req, "creator", "admin");
  if (error) return error;

  try {
    const { id: postId } = await params; // ✅ unwrap params

    // Get post with creator info
    const [post] = await db
      .select({
        post: posts,
        creator: creators,
      })
      .from(posts)
      .innerJoin(creators, eq(posts.creatorId, creators.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Security: Verify ownership (unless admin)
    if (
      session.user.role !== "admin" &&
      post.creator.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't own this post" },
        { status: 403 }
      );
    }

    // Delete media from Azure (if exists)
    if (post.post.mediaUrl) {
      try {
        const url = new URL(post.post.mediaUrl);
        const pathParts = url.pathname.split("/").filter(Boolean);

        if (pathParts.length >= 2) {
          const container = pathParts[0];
          const blobName = pathParts.slice(1).join("/");
          await deleteBlob(container, blobName);
        }
      } catch (azureError) {
        console.error("[Delete Post] Failed to delete blob:", azureError);
      }
    }

    // Delete thumbnail from Azure (if exists)
    if (post.post.thumbnailUrl) {
      try {
        const url = new URL(post.post.thumbnailUrl);
        const pathParts = url.pathname.split("/").filter(Boolean);

        if (pathParts.length >= 2) {
          const container = pathParts[0];
          const blobName = pathParts.slice(1).join("/");
          await deleteBlob(container, blobName);
        }
      } catch (azureError) {
        console.error("[Delete Post] Failed to delete thumbnail:", azureError);
      }
    }

    // Delete post from database
    await db.delete(posts).where(eq(posts.id, postId));

    // Decrement post count atomically
    await db
      .update(creators)
      .set({
        postCount: sql`GREATEST(${creators.postCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, post.post.creatorId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Delete Post] Failed:", err);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE POST
// ══════════════════════════════════════════════════════════════════════════════

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  const { session, error } = await assertRole(req, "creator", "admin");
  if (error) return error;

  try {
    const { id: postId } = await params; // ✅ unwrap
    const body = await req.json() as {
      title?: string;
      description?: string;
      isLocked?: boolean;
      ppvPrice?: number | null;
    };

    // Get post with creator info
    const [post] = await db
      .select({
        post: posts,
        creator: creators,
      })
      .from(posts)
      .innerJoin(creators, eq(posts.creatorId, creators.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Security: Verify ownership (unless admin)
    if (
      session.user.role !== "admin" &&
      post.creator.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't own this post" },
        { status: 403 }
      );
    }

    // Build update object
    const updates: any = { updatedAt: new Date() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.isLocked !== undefined) updates.isLocked = body.isLocked;
    if (body.ppvPrice !== undefined) {
      updates.ppvPrice = body.ppvPrice ? body.ppvPrice.toFixed(2) : null;
    }

    // Update post
    const [updated] = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, postId))
      .returning();

    return NextResponse.json({ success: true, post: updated });
  } catch (err) {
    console.error("[Update Post] Failed:", err);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// GET SINGLE POST
// ══════════════════════════════════════════════════════════════════════════════

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  const { session, error } = await assertRole(req, "creator", "admin");
  if (error) return error;

  try {
    const { id: postId } = await params; // ✅ unwrap

    const [post] = await db
      .select({
        post: posts,
        creator: creators,
      })
      .from(posts)
      .innerJoin(creators, eq(posts.creatorId, creators.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Security: Verify ownership (unless admin)
    if (
      session.user.role !== "admin" &&
      post.creator.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't own this post" },
        { status: 403 }
      );
    }

    return NextResponse.json({ post: post.post });
  } catch (err) {
    console.error("[Get Post] Failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}