// app/api/webhooks/maxelpay/tip/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tips, creators, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyWebhookSignature, type MaxelPayWebhookEvent } from "@/lib/maxelpay";

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
  const signature = req.headers.get("x-maxelpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event: MaxelPayWebhookEvent = JSON.parse(rawBody);
  const { orderId, status, currency, network } = event;

  const [tip] = await db
    .select()
    .from(tips)
    .where(eq(tips.maxelpayOrderId, orderId))
    .limit(1);

  if (!tip) return NextResponse.json({ received: true });

  if (status === "completed") {
    await db
      .update(tips)
      .set({ paymentStatus: "completed", cryptoCurrency: currency })
      .where(eq(tips.id, tip.id));

    // Add to creator's pending payout balance

await db
  .update(creators)
  .set({
    pendingPayout: sql`${creators.pendingPayout} + ${tip.amount}`,
    totalEarnings: sql`${creators.totalEarnings} + ${tip.amount}`,
    updatedAt: new Date(),
  })
  .where(eq(creators.id, tip.toCreatorId));

    await db.insert(transactions).values({
  userId:      tip.fromUserId,
  type:        "tip",
  amount:      tip.amount.toString(), // decimal expects string
  description: `Tip sent — ${currency} on ${network}`,
  maxelpayRef: orderId,
});

  } else if (status === "failed" || status === "expired") {
    await db
      .update(tips)
      .set({ paymentStatus: status })
      .where(eq(tips.id, tip.id));
  }

  return NextResponse.json({ received: true });
}