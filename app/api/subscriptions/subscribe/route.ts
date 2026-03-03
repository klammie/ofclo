// app/api/subscriptions/subscribe/route.ts
// Direct subscription endpoint (no payment required)

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { subscriptions, creators } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "user", "creator", "agency");
  if (error) return error;

  try {
    const body = await req.json();
    const { creatorId, tier } = body as {
      creatorId: string;
      tier: "standard" | "vip";
    };

    if (!creatorId || !tier) {
      return NextResponse.json(
        { error: "Creator ID and tier are required" },
        { status: 400 }
      );
    }

    // Get creator details
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Check if already subscribed
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Already subscribed to this creator" },
        { status: 400 }
      );
    }

    // Get price based on tier
    const price = tier === "vip" ? creator.vipPrice : creator.standardPrice;

    // Create subscription (no payment required)
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: session.user.id,
        creatorId: creatorId,
        tier: tier,
        status: "active",
        priceAtSubscription: price.toString(),
        paymentStatus: "completed", // Marked as completed (free subscription)
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .returning();

    // Update creator subscriber count
    await db
      .update(creators)
      .set({
        subscriberCount: creator.subscriberCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));

    console.log(`[Subscribe] User ${session.user.id} subscribed to creator ${creatorId} (${tier})`);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        expiresAt: subscription.currentPeriodEnd,
      },
    });

  } catch (err) {
    console.error("[Subscribe] Error:", err);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}