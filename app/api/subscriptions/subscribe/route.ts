import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, creators, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  sendNewSubscriberEmail,
  sendSubscriptionConfirmEmail,
} from "@/lib/email-server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
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

    // ── Fetch creator + linked user info ───────────────────────────────
    const [creator] = await db
      .select({
        creatorId: creators.id,
        subscriberCount: creators.subscriberCount,
        standardPrice: creators.standardPrice,
        vipPrice: creators.vipPrice,
        userEmail: user.email,
        userName: user.name,
      })
      .from(creators)
      .innerJoin(user, eq(creators.userId, user.id))
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // ── Check if already subscribed ────────────────────────────────────
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

    // ── Determine price ────────────────────────────────────────────────
    const price =
      tier === "vip"
        ? parseFloat(creator.vipPrice as unknown as string)
        : creator.standardPrice;

    // ── Create subscription ────────────────────────────────────────────
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: session.user.id,
        creatorId,
        tier,
        status: "active",
        priceAtSubscription: price.toString(),
        paymentStatus: "completed",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();

    // ── Update creator subscriber count ────────────────────────────────
    await db
      .update(creators)
      .set({
        subscriberCount: creator.subscriberCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));

    // ── Fire emails concurrently ───────────────────────────────────────
    await Promise.allSettled([
      sendNewSubscriberEmail({
        creatorEmail: creator.userEmail,
        creatorName: creator.userName,
        subscriberName: session.user.name,
        tier,
        amountCents: Math.round(price * 100),
      }),
      sendSubscriptionConfirmEmail({
        subscriberEmail: session.user.email,
        subscriberName: session.user.name,
        creatorName: creator.userName,
        creatorUsername:
          creator.userName.toLowerCase().replace(/\s/g, ""),
        tier,
        amountCents: Math.round(price * 100),
      }),
    ]);

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