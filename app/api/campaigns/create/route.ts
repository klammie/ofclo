// app/api/campaigns/create/route.ts
// POST — creates a crowdfunding campaign. Works for both:
//   - A creator creating their own campaign (creatorId resolved from their session)
//   - An agency creating a campaign on behalf of a creator they manage
//     (creatorId comes from the request body, agency must own that creator)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { campaigns, creators } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    creatorId,      // required when an agency creates this on behalf of a creator
    title,
    description,
    coverImageUrl,
    goalAmount,
    deadline,
    publishNow = true, // false = save as draft
  } = body;

  if (!title?.trim())       return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!description?.trim()) return NextResponse.json({ error: "description is required" }, { status: 400 });
  if (!goalAmount || Number(goalAmount) <= 0) return NextResponse.json({ error: "goalAmount must be greater than 0" }, { status: 400 });
  if (!deadline)             return NextResponse.json({ error: "deadline is required" }, { status: 400 });

  const deadlineDate = new Date(deadline);
  if (deadlineDate <= new Date()) {
    return NextResponse.json({ error: "deadline must be in the future" }, { status: 400 });
  }

  try {
    const role = session.user.role as string; // "creator" | "agency" | "user" | "admin"
    let resolvedCreatorId: string;
    let createdByRole: "creator" | "agency";

    if (role === "creator") {
      // Creator making their own campaign — resolve their own creators.id from session
      const ownCreator = await db.query.creators.findFirst({
        where: eq(creators.userId, session.user.id),
      });
      if (!ownCreator) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
      resolvedCreatorId = ownCreator.id;
      createdByRole = "creator";

    } else if (role === "agency") {
      // Agency making a campaign on behalf of a managed creator
      if (!creatorId) return NextResponse.json({ error: "creatorId is required for agency-created campaigns" }, { status: 400 });

      const managedCreator = await db.query.creators.findFirst({
        where: and(
          eq(creators.id, creatorId),
          eq(creators.agencyId, session.user.id), // adjust if your agency-creator link uses a different column
        ),
      });
      if (!managedCreator) return NextResponse.json({ error: "Creator not found or not managed by your agency" }, { status: 403 });
      resolvedCreatorId = managedCreator.id;
      createdByRole = "agency";

    } else {
      return NextResponse.json({ error: "Only creators and agencies can create campaigns" }, { status: 403 });
    }

    const [campaign] = await db.insert(campaigns).values({
      creatorId:       resolvedCreatorId,
      createdByUserId: session.user.id,
      createdByRole,
      title:           title.trim(),
      description:     description.trim(),
      coverImageUrl:   coverImageUrl?.trim() || null,
      goalAmount:      Number(goalAmount).toFixed(2),
      raisedAmount:    "0",
      pledgerCount:     0,
      status:          publishNow ? "active" : "draft",
      deadline:        deadlineDate,
    }).returning();

    console.log(`[campaigns/create] ${createdByRole} ${session.user.id} created campaign "${title}" for creator ${resolvedCreatorId}, goal=$${goalAmount}`);

    return NextResponse.json({ success: true, campaign }, { status: 201 });

  } catch (e: any) {
    console.error("[POST /api/campaigns/create] ERROR:", e?.message ?? e);
    return NextResponse.json({ error: "Failed to create campaign", detail: e?.message }, { status: 500 });
  }
}