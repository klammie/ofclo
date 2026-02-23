import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, creators, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyWebhookSignature, type MaxelPayWebhookEvent } from "@/lib/maxelpay";

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get("x-maxelpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[MaxelPay Webhook] Invalid signature — rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: MaxelPayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId, status, currency, network } = event;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.maxelpayOrderId, orderId))
    .limit(1);

  if (!sub) {
    console.warn(`[MaxelPay] Unknown orderId: ${orderId}`);
    return NextResponse.json({ received: true });
  }

  if (status === "completed") {
    await db
      .update(subscriptions)
      .set({
        paymentStatus:  "completed",
        cryptoCurrency: currency,
        cryptoNetwork:  network,
        status:         "active",
        updatedAt:      new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    await db
      .update(creators)
      .set({
        subscriberCount: sql`${creators.subscriberCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, sub.creatorId));

    await db.insert(transactions).values({
      userId:      sub.userId,
      type:        "subscription",
      amount:      sub.priceAtSubscription,
      description: `Subscription payment — ${currency} on ${network}`,
      maxelpayRef: orderId,
    });

  } else if (status === "failed" || status === "expired") {
    await db
      .update(subscriptions)
      .set({
        paymentStatus: status,
        status:        "cancelled",
        cancelledAt:   new Date(),
        updatedAt:     new Date(),
      })
      .where(eq(subscriptions.id, sub.id));
  }

  return NextResponse.json({ received: true });
}