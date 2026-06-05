// app/api/cron/publish-scheduled-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, creators } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  // Verify cron secret (for security)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get scheduled posts that are due
    const duePost = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.status, "scheduled"),
          lte(posts.scheduledFor, new Date())
        )
      );

    let publishedCount = 0;

    for (const post of duePosts) {
      // Publish post
      await db
        .update(posts)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, post.id));

      // Update creator post count
      await db.execute(sql`
        UPDATE ${creators}
        SET post_count = post_count + 1
        WHERE id = ${post.creatorId}
      `);

      publishedCount++;
      console.log(`[Cron] Published scheduled post: ${post.id}`);
    }

    return NextResponse.json({
      success: true,
      published: publishedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Cron] Error:", err);
    return NextResponse.json(
      { error: "Failed to publish scheduled posts" },
      { status: 500 }
    );
  }
}