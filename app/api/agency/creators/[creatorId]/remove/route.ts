// app/api/agency/creators/[creatorId]/remove/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { agencies, agencyCreators } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { creatorId } = await params;
    const { agencyId } = await req.json();

    // Verify agency
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.userId, session.user.id))
      .limit(1);

    if (!agency || agency.id !== agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Remove relationship
    await db
      .delete(agencyCreators)
      .where(
        and(
          eq(agencyCreators.agencyId, agencyId),
          eq(agencyCreators.creatorId, creatorId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Remove Creator] Error:", err);
    return NextResponse.json({ error: "Failed to remove creator" }, { status: 500 });
  }
}