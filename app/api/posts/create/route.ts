// app/api/posts/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { posts, creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const {
      creatorId,
      title,
      description,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      isLocked,
      ppvPrice,
      status,
      scheduledFor,
    } = await req.json();

    // Validation
    if (!mediaType || !mediaUrl) {
      return NextResponse.json(
        { error: "Media type and URL are required" },
        { status: 400 }
      );
    }

    // Verify creator owns this profile
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator || creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Validate scheduled time is in future
    if (status === "scheduled" && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        );
      }
    }

    // Create post
    const [post] = await db
      .insert(posts)
      .values({
        creatorId,
        title: title || null,
        description: description || null,
        mediaType,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || mediaUrl,
        isLocked: isLocked || false,
        ppvPrice: ppvPrice ? ppvPrice.toString() : null,
        status: status || "published",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();

    // Update post count if published immediately
    if (status === "published") {
      await db
        .update(creators)
        .set({
          postCount: creator.postCount + 1,
        })
        .where(eq(creators.id, creatorId));
    }

    console.log(`[Post] Created: ${post.id} (${status})`);

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error("[Create Post] Error:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}