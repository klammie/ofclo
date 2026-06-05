// app/api/campaigns/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { campaigns, creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const { title, description, goalAmount, deadline, imageUrl } = await req.json();

    // Validation
    if (!title || !description || !goalAmount) {
      return NextResponse.json(
        { error: "Title, description, and goal amount are required" },
        { status: 400 }
      );
    }

    if (parseFloat(goalAmount) <= 0) {
      return NextResponse.json(
        { error: "Goal amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get creator
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, session.user.id))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Create campaign
    const [campaign] = await db
      .insert(campaigns)
      .values({
        creatorId: creator.id,
        title,
        description,
        goalAmount: goalAmount.toString(),
        deadline: deadline ? new Date(deadline) : null,
        imageUrl: imageUrl || null,
        status: "active",
      })
      .returning();

    console.log(`[Campaign] Created: ${campaign.id} by creator ${creator.id}`);

    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    console.error("[Create Campaign] Error:", err);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}