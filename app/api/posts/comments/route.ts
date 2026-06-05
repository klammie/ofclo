// app/api/posts/comments/route.ts
// GET  ?postId=xxx&cursor=xxx  — fetch paginated comments
// POST { postId, content }      — post a new comment

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { comments, user, profiles, posts } from "@/db/schema";
import { eq, and, desc, lt, sql } from "drizzle-orm";

const PAGE_SIZE = 12;

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const cursor = searchParams.get("cursor"); // createdAt ISO for pagination

  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  try {
    const rows = await db
      .select({
        commentId:   comments.id,
        content:     comments.content,
        createdAt:   comments.createdAt,
        userId:      comments.userId,
        // user fields
        userName:    user.name,
        userImage:   user.image,
        // profile fields (left join — may be null)
        username:    profiles.username,
        avatarUrl:   profiles.avatarUrl,
      })
      .from(comments)
      .innerJoin(user,    eq(user.id,     comments.userId))
      .leftJoin(profiles, eq(profiles.id, comments.userId))
      .where(
        and(
          eq(comments.postId, postId),
          cursor ? lt(comments.createdAt, new Date(cursor)) : undefined,
        )
      )
      .orderBy(desc(comments.createdAt))
      .limit(PAGE_SIZE + 1);

    const hasMore = rows.length > PAGE_SIZE;
    const page    = rows.slice(0, PAGE_SIZE);

    const mapped = page.map((r) => ({
      id:        r.commentId,
      content:   r.content,
      createdAt: r.createdAt.toISOString(),
      userId:    r.userId,
      isOwn:     r.userId === session.user.id,
      user: {
        name:      r.userName,
        username:  r.username ?? r.userName.toLowerCase().replace(/\s+/g, "_"),
        avatarUrl: r.avatarUrl ?? r.userImage ?? null,
      },
    }));

    const nextCursor = hasMore
      ? page[page.length - 1].createdAt
      : null;

    return NextResponse.json({ comments: mapped, hasMore, cursor: nextCursor });

  } catch (e: any) {
    console.error("[GET /api/posts/comments]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, content } = await req.json().catch(() => ({}));

  if (!postId)            return NextResponse.json({ error: "postId required" },           { status: 400 });
  if (!content?.trim())   return NextResponse.json({ error: "content required" },          { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "Comment too long (max 500)" }, { status: 400 });

  try {
    // Insert comment
    const [comment] = await db
      .insert(comments)
      .values({
        postId,
        userId:  session.user.id,
        content: content.trim(),
      })
      .returning();

    // Increment post commentCount cache
    await db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));

    // Fetch the commenter's profile for the response
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, session.user.id),
    });

    return NextResponse.json({
      comment: {
        id:        comment.id,
        content:   comment.content,
        createdAt: comment.createdAt.toISOString(),
        userId:    comment.userId,
        isOwn:     true,
        user: {
          name:      session.user.name,
          username:  profile?.username ?? session.user.name.toLowerCase().replace(/\s+/g, "_"),
          avatarUrl: profile?.avatarUrl ?? session.user.image ?? null,
        },
      },
    });

  } catch (e: any) {
    console.error("[POST /api/posts/comments]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}