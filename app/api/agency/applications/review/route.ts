// app/api/agency/applications/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creatorApplications, creators, profiles, agencies, agencyCreators, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { applicationId, action, reason } = await req.json();

    // Get application
    const [application] = await db
      .select()
      .from(creatorApplications)
      .where(eq(creatorApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "pending") {
      return NextResponse.json({ error: "Application already reviewed" }, { status: 400 });
    }

    if (action === "approve") {
      // Create creator account
      const [newCreator] = await db
        .insert(creators)
        .values({
          userId: application.userId,
          isVerified: false,
          subscriberCount: 0,
          postCount: 0,
          standardPrice: "9.99",
          vipPrice: "19.99",
        })
        .returning();

      // Update user role
      await db
        .update(user)
        .set({ role: "creator" })
        .where(eq(user.id, application.userId));

      // Get agency
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.userId, session.user.id))
        .limit(1);

      // Link creator to agency
      if (agency) {
        await db.insert(agencyCreators).values({
          agencyId: agency.id,
          creatorId: newCreator.id,
          permissions: "full",
        });
      }

      // Update application
      await db
        .update(creatorApplications)
        .set({
          status: "approved",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(creatorApplications.id, applicationId));

      console.log(`[Agency] Approved creator application: ${application.userId}`);

      return NextResponse.json({ success: true, action: "approved" });
    } else if (action === "reject") {
      // Update application
      await db
        .update(creatorApplications)
        .set({
          status: "rejected",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          rejectionReason: reason,
        })
        .where(eq(creatorApplications.id, applicationId));

      console.log(`[Agency] Rejected creator application: ${application.userId}`);

      return NextResponse.json({ success: true, action: "rejected" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[Agency Review] Error:", err);
    return NextResponse.json({ error: "Failed to review application" }, { status: 500 });
  }
}