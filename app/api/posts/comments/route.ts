// app/api/posts/[postId]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { comments, posts, creators, agencies, notifications, user, profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

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
      userId:  session.user.id,
      content: content.trim(),
    })
    .returning();

  // Update comment count
  await db
    .update(posts)
    .set({ commentCount: sql`comment_count + 1` })
    .where(eq(posts.id, postId));

  // Get commenter info for the notification body + response shape
  const userData = await db.execute<{
    user_name:  string;
    username:   string;
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

  // ── Notify creator (and agency) on new comment ──────────────────────────────
  // Skip if the creator commented on their own post
  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { creatorId: true, title: true, description: true },
    });

    if (post && post.creatorId !== session.user.id) {
      const creator = await db.query.creators.findFirst({
        where: eq(creators.id, post.creatorId),
        columns: { userId: true, agencyId: true },
      });

      if (creator) {
        const postLabel    = post.title ?? post.description ?? "your post";
        const commenterName = userInfo?.user_name ?? "Someone";
        const snippet      = content.trim().length > 60
          ? content.trim().slice(0, 60) + "…"
          : content.trim();

        const notifBase = {
          type:        "new_comment" as const,
          priority:    "medium"      as const,
          title:       `New comment on "${postLabel}"`,
          body:        `${commenterName}: "${snippet}"`,
          icon:        "💬",
          actionUrl:   `/posts/${postId}`,
          actorId:     session.user.id,
          actorName:   commenterName,
          actorAvatar: userInfo?.avatar_url ?? null,
          entityId:    postId,
          isRead:      false,
          createdAt:   new Date(),
        };

        // Notify the creator
        await db.insert(notifications).values({
          id:     randomUUID(),
          userId: creator.userId,
          ...notifBase,
        });

        // Notify their agency if they have one
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
            });
          }
        }
      }
    }
  } catch (e) {
    // Non-fatal
    console.error("[comments] notification error:", e);
  }

  return NextResponse.json({
    comment: {
      id:         comment.id,
      content:    comment.content,
      created_at: comment.createdAt,
      user_name:  userInfo?.user_name  ?? session.user.name,
      username:   userInfo?.username   ?? session.user.email.split("@")[0],
      avatar_url: userInfo?.avatar_url ?? null,
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  const commentsList = await db.execute<{
    id:         string;
    content:    string;
    created_at: Date;
    user_name:  string;
    username:   string;
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