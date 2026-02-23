// app/api/cron/renew-subscriptions/route.ts
// Called by Vercel Cron / external scheduler daily
// Re-initiates checkout for subscriptions expiring within 48 hours
// Add to vercel.json: { "crons": [{ "path": "/api/cron/renew-subscriptions", "schedule": "0 9 * * *" }] }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, user, creators } from "@/db/schema";
import { eq, and, lte, gte, isNull } from "drizzle-orm";
import { createCheckout, generateOrderId } from "@/lib/maxelpay";

const WEBHOOK_BASE  = process.env.NEXT_PUBLIC_URL!;
const CRON_SECRET   = process.env.CRON_SECRET!;

export async function GET(req: NextRequest) {
  // Verify this is called by our scheduler, not a random visitor
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now     = new Date();
  const in48h   = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find active subscriptions expiring within 48h that have no pending renewal
  const expiringSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.currentPeriodEnd, in48h),
        gte(subscriptions.currentPeriodEnd, now),
        isNull(subscriptions.renewalOrderId)
      )
    );

  let renewed = 0;
  let failed  = 0;

  for (const sub of expiringSubs) {
    try {
      // Fetch user + creator for the checkout payload
     const [[fetchedUser], [fetchedCreator]] = await Promise.all([
  db.select().from(user).where(eq(user.id, sub.userId)).limit(1),
  db.select().from(creators).where(eq(creators.id, sub.creatorId)).limit(1),
]);

if (!fetchedUser || !fetchedCreator) continue;

      const renewalOrderId = generateOrderId("sub", sub.userId);

      await createCheckout({
  orderId:     renewalOrderId,
  amountUsd:   Number(sub.priceAtSubscription),
  userEmail:   fetchedUser.email,
  userName:    fetchedUser.name,
  redirectUrl: `${WEBHOOK_BASE}/dashboard/user/subscriptions?renewal=success&orderId=${renewalOrderId}`,
  cancelUrl:   `${WEBHOOK_BASE}/dashboard/user/subscriptions?renewal=cancelled`,
  webhookUrl:  `${WEBHOOK_BASE}/api/webhooks/maxelpay/subscription`,
});

      // Tag the subscription with the pending renewal order ID
      await db
        .update(subscriptions)
        .set({ renewalOrderId })
        .where(eq(subscriptions.id, sub.id));

      // TODO: send renewal email/notification to user here

      renewed++;
    } catch (err) {
      console.error(`[Cron] Renewal failed for sub ${sub.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ renewed, failed, total: expiringSubs.length });
}