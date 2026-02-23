// app/api/checkout/subscribe/route.ts
// Uses getSessionForApiRoute() instead of getServerSession(authOptions)

import { NextRequest, NextResponse }  from "next/server";
import { assertRole }                 from "@/lib/auth/guard";
import { db }                         from "@/db";
import { user, creators, subscriptions } from "@/db/schema";
import { eq, and }                    from "drizzle-orm";
import { createCheckout, generateOrderId } from "@/lib/maxelpay";

const WEBHOOK_BASE = process.env.NEXT_PUBLIC_URL!;

export async function POST(req: NextRequest) {
  // Any authenticated user (with role "user") can subscribe
  const { session, error } = await assertRole(req, "user", "creator", "agency", "admin");
  if (error) return error;

  const { creatorId, tier } = await req.json() as {
    creatorId: string;
    tier:      "standard" | "vip";
  };

  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator || creator.status !== "active") {
    return NextResponse.json({ error: "Creator not found or inactive" }, { status: 404 });
  }

  const [existingSub] = await db
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

  if (existingSub) {
    return NextResponse.json(
      { error: "Already subscribed to this creator" },
      { status: 409 }
    );
  }

  // BetterAuth's user object has email and name directly
  const priceUsd = tier === "vip"
    ? Number(creator.vipPrice)
    : Number(creator.standardPrice);

  const orderId = generateOrderId("sub", session.user.id);
  const now     = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.insert(subscriptions).values({
    userId:              session.user.id,
    creatorId,
    tier,
    status:              "active",
    priceAtSubscription: priceUsd.toFixed(2),
    maxelpayOrderId:     orderId,
    paymentStatus:       "initiated",
    currentPeriodStart:  now,
    currentPeriodEnd:    periodEnd,
  });

  try {
    const checkout = await createCheckout({
      orderId,
      amountUsd:   priceUsd,
      // BetterAuth session.user has email and name natively
      userEmail:   session.user.email,
      userName:    session.user.name,
      redirectUrl: `${WEBHOOK_BASE}/dashboard/user/subscriptions?payment=success&orderId=${orderId}`,
      cancelUrl:   `${WEBHOOK_BASE}/dashboard/user/subscriptions?payment=cancelled&orderId=${orderId}`,
      webhookUrl:  `${WEBHOOK_BASE}/api/webhooks/maxelpay/subscription`,
    });

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, orderId });

  } catch (err) {
    await db.delete(subscriptions)
      .where(eq(subscriptions.maxelpayOrderId, orderId));
    console.error("[MaxelPay] Checkout creation failed:", err);
    return NextResponse.json(
      { error: "Payment gateway unavailable." },
      { status: 502 }
    );
  }
}