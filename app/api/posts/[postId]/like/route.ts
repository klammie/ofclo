// app/api/posts/[postId]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { recordQuestAction } from "@/lib/quest-progress.service";
import { db } from "@/db";
import { likes, posts, creators, notifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

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
    // Unlike — remove like and decrement count
    await db.delete(likes).where(eq(likes.id, existing.id));
    await db.update(posts)
      .set({ likeCount: sql`like_count - 1` })
      .where(eq(posts.id, postId));
    return NextResponse.json({ liked: false });
  }

  // Like — insert, increment count
  await db.insert(likes).values({ userId: session.user.id, postId });
  await db.update(posts)
    .set({ likeCount: sql`like_count + 1` })
    .where(eq(posts.id, postId));

  await recordQuestAction(session.user.id, "like_post").catch(() => {});

  // ── Notify the creator (and their agency) ──────────────────────────────────
  // Don't notify if the creator liked their own post
  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { creatorId: true, title: true, description: true, thumbnailUrl: true },
    });

    if (post && post.creatorId !== session.user.id) {
      // Get the creator's userId so we can notify them directly
      const creator = await db.query.creators.findFirst({
        where: eq(creators.id, post.creatorId),
        columns: { userId: true, agencyId: true },
      });

      if (creator) {
        const postLabel = post.title ?? post.description ?? "your post";
        const notifBase = {
          type:      "new_like" as const,
          priority:  "medium"   as const,
          title:     "New like on your post",
          body:      `Someone liked "${postLabel}"`,
          icon:      "❤️",
          actionUrl: `/posts/${postId}`,
          actorId:   session.user.id,
          entityId:  postId,
          isRead:    false,
          createdAt: new Date(),
        };

        // Notify the creator
        await db.insert(notifications).values({
          id:     randomUUID(),
          userId: creator.userId,
          ...notifBase,
        });

        // Also notify their agency if they have one
        if (creator.agencyId) {
          const agency = await db.query.agencies.findFirst({
            where: eq(agencies.id, creator.agencyId),
            columns: { userId: true },
          }).catch(() => null);

          if (agency) {
            await db.insert(notifications).values({
              id:     randomUUID(),
              userId: agency.userId,
              ...notifBase,
              body: `${creator.userId === session.user.id ? "A creator" : "Someone"} liked "${postLabel}"`,
            });
          }
        }
      }
    }
  } catch (e) {
    // Non-fatal — don't fail the like if notification fails
    console.error("[like] notification error:", e);
  }

  return NextResponse.json({ liked: true });
}