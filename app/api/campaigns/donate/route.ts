// app/api/campaigns/donate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { campaigns, campaignDonations, topFanBadges, creators } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "user", "creator", "agency");
  if (error) return error;

  try {
    const { campaignId, amount, message, isAnonymous } = await req.json();

    // Validation
    if (!campaignId || !amount) {
      return NextResponse.json(
        { error: "Campaign ID and amount are required" },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get campaign
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status !== "active") {
      return NextResponse.json(
        { error: "Campaign is not active" },
        { status: 400 }
      );
    }

    // Create donation
    const [donation] = await db
      .insert(campaignDonations)
      .values({
        campaignId,
        userId: session.user.id,
        amount: amount.toString(),
        message: message || null,
        isAnonymous: isAnonymous || false,
      })
      .returning();

    // Update campaign totals
    const newCurrentAmount = parseFloat(campaign.currentAmount) + parseFloat(amount);
    const newDonorCount = campaign.donorCount + 1;

    await db
      .update(campaigns)
      .set({
        currentAmount: newCurrentAmount.toString(),
        donorCount: newDonorCount,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    // Check if this user is now the top donor
    const totalDonated = await db.execute<{ total: string }>(sql`
      SELECT COALESCE(SUM(amount::decimal), 0)::text as total
      FROM ${campaignDonations}
      WHERE campaign_id = ${campaignId} AND user_id = ${session.user.id}
    `);

    const userTotalDonated = parseFloat(totalDonated.rows[0].total);
    const currentTopDonorAmount = parseFloat(campaign.topDonorAmount || "0");

    if (userTotalDonated > currentTopDonorAmount) {
      // Update top donor
      await db
        .update(campaigns)
        .set({
          topDonorId: session.user.id,
          topDonorAmount: userTotalDonated.toString(),
        })
        .where(eq(campaigns.id, campaignId));

      // Award top fan badge
      await db
        .insert(topFanBadges)
        .values({
          userId: session.user.id,
          creatorId: campaign.creatorId,
          badgeType: "top_donor",
          metadata: JSON.stringify({
            campaignId,
            amount: userTotalDonated,
          }),
        })
        .onConflictDoNothing();

      console.log(`[Campaign] New top donor: ${session.user.id} with $${userTotalDonated}`);
    }

    // Check if goal reached
    if (newCurrentAmount >= parseFloat(campaign.goalAmount)) {
      await db
        .update(campaigns)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId));

      console.log(`[Campaign] Goal reached: ${campaignId}`);
    }

    console.log(`[Campaign] Donation: ${session.user.id} donated $${amount} to ${campaignId}`);

    return NextResponse.json({ success: true, donation });
  } catch (err) {
    console.error("[Campaign Donate] Error:", err);
    return NextResponse.json(
      { error: "Failed to process donation" },
      { status: 500 }
    );
  }
}