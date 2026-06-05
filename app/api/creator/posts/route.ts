// app/api/creator/posts/route.ts
// Updated to support duration + thumbnailUrl from the upload route.
// Multi-media carousel requires adding postMedia table first (see comment below).

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { posts, creators, profiles } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notifySubscribersOfNewPost } from "@/lib/notifications.service";

// ─── NOTE: Carousel / multi-media ────────────────────────────────────────────
// To support multiple media per post, first add to your schema.ts:
//
//   mediaCount: integer("media_count").notNull().default(1),
//
// And create a new postMedia table:
//
//   export const postMedia = pgTable("post_media", {
//     id:           serial("id").primaryKey(),
//     postId:       uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
//     sortOrder:    integer("sort_order").notNull().default(0),
//     mediaType:    text("media_type").notNull(),
//     mediaUrl:     text("media_url").notNull(),
//     thumbnailUrl: text("thumbnail_url"),
//     duration:     integer("duration"),
//     createdAt:    timestamp("created_at").notNull().defaultNow(),
//   });
//
// Then run: npx drizzle-kit push
// Then uncomment the postMedia import and insert block below.
// ─────────────────────────────────────────────────────────────────────────────

interface MediaItem {
  mediaUrl:     string;
  thumbnailUrl: string | null;
  duration:     number | null;
  mediaType:    "image" | "video";
}

interface PostBody {
  title:         string;
  description?:  string | null;
  isLocked?:     boolean;
  ppvPrice?:     number | null;
  status?:       "published" | "draft" | "scheduled";
  // Single media (from your existing upload form)
  mediaUrl?:     string;
  thumbnailUrl?: string | null;
  duration?:     number | null;
  mediaType?:    "image" | "video";
  // Multi-media carousel (future — needs postMedia table first)
  mediaItems?:   MediaItem[];
}

// ─── POST — create a post ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const body = await req.json() as PostBody;

    const {
      title, description, isLocked = false,
      ppvPrice, status = "published",
      mediaUrl, thumbnailUrl, duration, mediaType,
      mediaItems,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Resolve the cover media — prefer mediaItems[0] if provided, else single fields
    const cover: MediaItem | null = mediaItems?.length
      ? mediaItems[0]
      : mediaUrl
        ? {
            mediaUrl,
            thumbnailUrl: thumbnailUrl ?? null,
            duration:     duration     ?? null,
            mediaType:    mediaType    ?? "image",
          }
        : null;

    if (!cover?.mediaUrl) {
      return NextResponse.json({ error: "mediaUrl is required" }, { status: 400 });
    }

    // Get creator record
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, session.user.id))
      .limit(1);

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    // Insert post — using your existing schema columns
    const [post] = await db
      .insert(posts)
      .values({
        creatorId:    creator.id,
        title:        title.trim(),
        description:  description?.trim() ?? null,
        mediaType:    cover.mediaType,                    // ← "image" | "video"
        mediaUrl:     cover.mediaUrl,
        thumbnailUrl: cover.thumbnailUrl ?? null,         // ← now populated for videos
        duration:     cover.duration     ?? null,         // ← now populated for videos
        isLocked,
        ppvPrice:     ppvPrice != null ? String(ppvPrice.toFixed(2)) : null,
        status,
        publishedAt:  status === "published" ? new Date() : null,
      })
      .returning();

    // ── Uncomment once postMedia table exists ─────────────────────────────────
    // if (mediaItems && mediaItems.length > 1) {
    //   const { postMedia } = await import("@/db/schema");
    //   await db.insert(postMedia).values(
    //     mediaItems.map((item, idx) => ({
    //       postId:       post.id,
    //       sortOrder:    idx,
    //       mediaType:    item.mediaType,
    //       mediaUrl:     item.mediaUrl,
    //       thumbnailUrl: item.thumbnailUrl,
    //       duration:     item.duration,
    //     }))
    //   );
    // }
    // ─────────────────────────────────────────────────────────────────────────

    // Increment creator post count
    await db
      .update(creators)
      .set({
        postCount:  sql`${creators.postCount} + 1`,
        updatedAt:  new Date(),
      })
      .where(eq(creators.id, creator.id));

    // ── Notify all active subscribers (fire-and-forget, don't block response) ──
    if (status === "published") {
      // Fetch creator's profile for avatar
      const creatorProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, creator.userId),
      }).catch(() => null);

      notifySubscribersOfNewPost({
        creatorId:     creator.id,
        creatorName:   post.title ? post.title.slice(0, 40) : "New post",
        creatorAvatar: creatorProfile?.avatarUrl ?? null,
        postId:        post.id,
        postPreview:   post.description ?? post.title ?? "New content just dropped!",
      }).catch((e) => console.error("[notify subscribers]", e?.message));
    }

    return NextResponse.json({ success: true, post });

  } catch (e: any) {
    console.error("[POST /api/creator/posts]", e?.message ?? e);
    return NextResponse.json(
      { error: "Failed to create post", detail: e?.message },
      { status: 500 }
    );
  }
}

// ─── GET — fetch creator's posts ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, session.user.id))
      .limit(1);

    if (!creator) return NextResponse.json({ posts: [] });

    const creatorPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.creatorId, creator.id))
      .orderBy(desc(posts.createdAt));

    return NextResponse.json({ posts: creatorPosts });

  } catch (e: any) {
    console.error("[GET /api/creator/posts]", e?.message ?? e);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}