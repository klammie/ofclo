// app/api/agency/creators/[creatorId]/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { posts, agencies, agencyCreators } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { creatorId } = await params;
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    // Verify agency manages this creator
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.userId, session.user.id))
      .limit(1);

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const [relationship] = await db
      .select()
      .from(agencyCreators)
      .where(
        and(
          eq(agencyCreators.agencyId, agency.id),
          eq(agencyCreators.creatorId, creatorId)
        )
      )
      .limit(1);

    if (!relationship) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get posts
    let query = db
      .select()
      .from(posts)
      .where(eq(posts.creatorId, creatorId));

    if (filter !== "all") {
      query = query.where(eq(posts.status, filter));
    }

    const creatorPosts = await query.orderBy(desc(posts.createdAt));

    return NextResponse.json({ posts: creatorPosts });
  } catch (err) {
    console.error("[Get Creator Posts] Error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}