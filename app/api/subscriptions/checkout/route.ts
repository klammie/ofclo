// app/api/subscriptions/checkout/route.ts
// New route — creates a MaxelPay session for a subscription instead of
// the instant "active" insert your current /subscribe route does.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, creators, user, maxelpaySessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getSubscriptionPrice } from "@/lib/subscription-pricing.service";
import { createPaymentSession, maxelpayCallbackUrl, maxelpayPublicUrl } from "@/lib/maxelpay";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { creatorId, tier } = body as { creatorId: string; tier: "standard" | "vip" };

  if (!creatorId || !tier) {
    return NextResponse.json({ error: "Missing creatorId or tier" }, { status: 400 });
  }

  const existing = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.userId, session.user.id), eq(subscriptions.creatorId, creatorId)),
  });
  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "You're already subscribed to this creator" }, { status: 409 });
  }

  const creatorRow = await db.query.creators.findFirst({ where: eq(creators.id, creatorId) });
  if (!creatorRow) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  const creatorUser = await db.query.user.findFirst({ where: eq(user.id, creatorRow.userId) });
  if (!creatorUser) return NextResponse.json({ error: "Creator user not found" }, { status: 404 });

  const pricing = await getSubscriptionPrice(session.user.id, creatorId, tier);

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Insert as "pending" — flipped to "active" by the webhook on payment.completed
  const [newSub] = await db.insert(subscriptions).values({
    userId:              session.user.id,
    creatorId,
    tier,
    status:              "pending" as any, // adjust if your subStatusEnum needs a literal "pending" value added
    priceAtSubscription: pricing.finalPrice.toFixed(2),
    paymentStatus:       "initiated",
    currentPeriodStart:  now,
    currentPeriodEnd:    periodEnd,
  }).returning();

  const orderId = `sub_${newSub.id}`;

  const checkoutSession = await createPaymentSession({
  orderId,
  amount:      pricing.finalPrice,
  currency:    "USD",
  description: `Subscription to ${creatorUser.name} (${tier})`,
  successUrl:  `${maxelpayPublicUrl()}/dashboard/user/subscriptions?sub=success`,
  cancelUrl:   `${maxelpayPublicUrl()}/dashboard/user/subscriptions?sub=cancelled`,
  callbackUrl: maxelpayCallbackUrl(),
});

  await db.insert(maxelpaySessions).values({
    sessionId:    checkoutSession.sessionId,
    orderId,
    userId:       session.user.id,
    purpose:      "subscription",
    linkedSubId:  newSub.id,
    amountCents:  Math.round(pricing.finalPrice * 100),
    status:       "pending",
  });

  await db.update(subscriptions)
    .set({ maxelpayOrderId: checkoutSession.sessionId })
    .where(eq(subscriptions.id, newSub.id));

  return NextResponse.json({
    success: true,
    checkoutUrl: checkoutSession.checkoutUrl,
    subscriptionId: newSub.id,
  });
}