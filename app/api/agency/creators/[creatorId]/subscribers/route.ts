// app/api/agency/creators/[creatorId]/subscribers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { subscriptions, user, agencies, agencyCreators } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

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

    // Get subscribers
    const subscribersData = await db.execute<{
      id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      tier: string;
      status: string;
      price_at_subscription: string;
      created_at: Date;
      current_period_end: Date;
    }>(sql`
      SELECT 
        s.id,
        s.user_id,
        u.name as user_name,
        u.email as user_email,
        s.tier,
        s.status,
        s.price_at_subscription,
        s.created_at,
        s.current_period_end
      FROM ${subscriptions} s
      JOIN ${user} u ON s.user_id = u.id
      WHERE s.creator_id = ${creatorId}
        ${filter !== "all" ? sql`AND s.status = ${filter}` : sql``}
      ORDER BY s.created_at DESC
    `);

    return NextResponse.json({ subscribers: subscribersData.rows });
  } catch (err) {
    console.error("[Get Subscribers] Error:", err);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}