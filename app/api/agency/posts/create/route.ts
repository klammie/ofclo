import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, agencyCreators, agencies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    creatorId, title, description, mediaType, mediaUrl,
    thumbnailUrl, duration, isLocked, ppvPrice, status, scheduledFor,
  } = body;

  if (!creatorId || !mediaUrl || !mediaType) {
    return NextResponse.json({ error: "creatorId, mediaUrl, and mediaType are required" }, { status: 400 });
  }

  // Verify this agency manages this creator
  const [agency] = await db.select().from(agencies).where(eq(agencies.userId, session.user.id)).limit(1);
  if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 403 });

  const [rel] = await db.select().from(agencyCreators)
    .where(and(eq(agencyCreators.agencyId, agency.id), eq(agencyCreators.creatorId, creatorId)))
    .limit(1);
  if (!rel) return NextResponse.json({ error: "You do not manage this creator" }, { status: 403 });

  try {
    const [post] = await db.insert(posts).values({
      id:           randomUUID(),
      creatorId,
      title:        title ?? null,
      description:  description ?? null,
      mediaType,
      mediaUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      duration:     duration ?? null,
      isLocked:     isLocked ?? false,
      ppvPrice:     ppvPrice ? Math.round(ppvPrice * 100) : null,
      status:       status ?? "published",
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      likeCount:    0,
      commentCount: 0,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    }).returning();

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (e: any) {
    console.error("[agency/posts/create]", e?.message);
    return NextResponse.json({ error: "Failed to create post", detail: e?.message }, { status: 500 });
  }
}