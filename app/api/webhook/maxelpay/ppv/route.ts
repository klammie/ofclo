// app/api/webhooks/maxelpay/ppv/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ppvUnlocks, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, type MaxelPayWebhookEvent } from "@/lib/maxelpay";

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
  const signature = req.headers.get("x-maxelpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event: MaxelPayWebhookEvent = JSON.parse(rawBody);
  const { orderId, status, currency, network } = event;

  const [unlock] = await db
    .select()
    .from(ppvUnlocks)
    .where(eq(ppvUnlocks.maxelpayOrderId, orderId))
    .limit(1);

  if (!unlock) return NextResponse.json({ received: true });

  if (status === "completed") {
    await db
      .update(ppvUnlocks)
      .set({
        paymentStatus:  "completed",
        cryptoCurrency: currency,
      })
      .where(eq(ppvUnlocks.id, unlock.id));

    await db.insert(transactions).values({
      userId:      unlock.userId,
      type:        "ppv",
      amount:      unlock.amountPaid,
      description: `PPV unlock — ${currency} on ${network}`,
      maxelpayRef: orderId,   // ✅ fixed
    });
  } else if (status === "failed" || status === "expired") {
    await db
      .update(ppvUnlocks)
      .set({ paymentStatus: status })
      .where(eq(ppvUnlocks.id, unlock.id));
  }

  return NextResponse.json({ received: true });
}