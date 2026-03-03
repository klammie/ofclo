// app/api/creator/posts/route.ts
// Create a new post with Azure-hosted media

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { posts, creators } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const body = await req.json() as {
      title:        string;
      description?: string;
      contentType:  "image" | "video";
      mediaUrl:     string;
      thumbnailUrl?: string;
      isLocked:     boolean;
      ppvPrice?:    number | null;
    };

    const {
      title,
      description,
      contentType,
      mediaUrl,
      thumbnailUrl,
      isLocked,
      ppvPrice,
    } = body;

    // Validation
    if (!title || !mediaUrl || !contentType) {
      return NextResponse.json(
        { error: "title, mediaUrl, and contentType are required" },
        { status: 400 }
      );
    }

    if (isLocked && ppvPrice && ppvPrice < 0) {
      return NextResponse.json(
        { error: "ppvPrice must be positive" },
        { status: 400 }
      );
    }

    // Get creator record
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, session.user.id))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Create post
    const [post] = await db
      .insert(posts)
      .values({
        creatorId: creator.id,
        title,
        description: description || null,
        contentType,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || null,
        isLocked,
        ppvPrice: ppvPrice ? ppvPrice.toFixed(2) : null,
        isPublished: true,
      })
      .returning();

    // Increment post count
    await db
  .update(creators)
  .set({
    postCount: sql`${creators.postCount} + 1`,
    updatedAt: new Date(),
  })
  .where(eq(creators.id, creator.id));

    return NextResponse.json({ success: true, post });

  } catch (err) {
    console.error("[Create Post] Failed:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    // Get creator's posts
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, session.user.id))
      .limit(1);

    if (!creator) {
      return NextResponse.json({ posts: [] });
    }

    const creatorPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.creatorId, creator.id))
      .orderBy(posts.createdAt);

    return NextResponse.json({ posts: creatorPosts });

  } catch (err) {
    console.error("[Get Posts] Failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}