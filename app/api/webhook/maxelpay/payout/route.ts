// app/api/webhooks/maxelpay/payout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payouts, creators } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/maxelpay";


export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
  const signature = req.headers.get("x-maxelpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    payoutId: string;
    status:   "completed" | "failed";
    txHash:   string;
  };

  const [payout] = await db
    .select()
    .from(payouts)
    .where(eq(payouts.maxelpayTransferId, event.payoutId))
    .limit(1);

  if (!payout) return NextResponse.json({ received: true });

  if (event.status === "completed") {
    await db
      .update(payouts)
      .set({ status: "sent", processedAt: new Date(), updatedAt: new Date() })
      .where(eq(payouts.id, payout.id));

    // Deduct the paid-out amount from creator's pendingPayout balance
    

await db
  .update(creators)
  .set({
    pendingPayout: sql`GREATEST(${creators.pendingPayout} - ${payout.netAmount}, 0)`,
    updatedAt: new Date(),
  })
  .where(eq(creators.id, payout.creatorId));

  } else {
    await db
      .update(payouts)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payouts.id, payout.id));
  }

  return NextResponse.json({ received: true });
}