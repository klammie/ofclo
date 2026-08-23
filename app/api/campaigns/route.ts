// app/api/campaigns/route.ts
// GET ?creatorId=xxx — returns all campaigns for a given creator.
// Called by CreatorOverviewDashboard to populate the campaigns section.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { campaigns, creators } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");

  if (!creatorId) return NextResponse.json({ error: "creatorId required" }, { status: 400 });

  try {
    // Verify the requesting user owns this creator profile OR is an agency
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });

    if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

    const role = session.user.role as string;
    const isOwner = creator.userId === session.user.id;
    const isAgencyOrAdmin = role === "agency" || role === "admin";

    if (!isOwner && !isAgencyOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.creatorId, creatorId))
      .orderBy(desc(campaigns.createdAt));

    return NextResponse.json({ campaigns: rows });
  } catch (e: any) {
    console.error("[GET /api/campaigns]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}