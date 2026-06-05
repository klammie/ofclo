// app/api/bookmarks/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "user", "creator", "agency");
  if (error) return error;

  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    // Check if already bookmarked
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.user.id),
          eq(bookmarks.postId, postId)
        )
      )
      .limit(1);

    if (existing) {
      // Remove bookmark
      await db
        .delete(bookmarks)
        .where(eq(bookmarks.id, existing.id));

      return NextResponse.json({ bookmarked: false });
    } else {
      // Add bookmark
      await db.insert(bookmarks).values({
        userId: session.user.id,
        postId,
      });

      return NextResponse.json({ bookmarked: true });
    }
  } catch (err) {
    console.error("[Bookmark Toggle] Error:", err);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}