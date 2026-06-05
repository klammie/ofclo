// app/api/agency/creators/[creatorId]/toggle-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators, agencies, agencyCreators } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { creatorId } = await params;

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

    // Get current status and toggle
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    await db
      .update(creators)
      .set({ isVerified: !creator.isVerified })
      .where(eq(creators.id, creatorId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Toggle Verification] Error:", err);
    return NextResponse.json({ error: "Failed to toggle verification" }, { status: 500 });
  }
}