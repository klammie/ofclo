// app/api/agency/impersonate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { agencyCreators, agencies, creators, user } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { creatorUserId } = await req.json();

    // Get agency
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.userId, session.user.id))
      .limit(1);

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Get the creator to verify agency manages them
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, creatorUserId))
      .limit(1);

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify agency manages this creator
    const [relationship] = await db
      .select()
      .from(agencyCreators)
      .where(
        and(
          eq(agencyCreators.agencyId, agency.id),
          eq(agencyCreators.creatorId, creator.id)
        )
      )
      .limit(1);

    if (!relationship) {
      return NextResponse.json(
        { error: "This creator is not managed by your agency" },
        { status: 403 }
      );
    }

    // Store original user ID in cookie for later restoration
    const cookieStore = await cookies();
    cookieStore.set("original_user_id", session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    cookieStore.set("impersonating_user_id", creatorUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    console.log(`[Agency] Impersonating creator: ${creatorUserId}`);

    return NextResponse.json({ 
      success: true,
      redirectTo: "/dashboard/creator"
    });
  } catch (err) {
    console.error("[Agency Impersonate] Error:", err);
    return NextResponse.json({ error: "Failed to impersonate" }, { status: 500 });
  }
}