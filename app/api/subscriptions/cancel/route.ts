// app/api/subscriptions/cancel/route.ts
// Cancels a subscription — sets cancelAtPeriodEnd = true so the user
// keeps access until nextBillingDate, then it expires.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscriptionId } = await req.json().catch(() => ({}));
  if (!subscriptionId) return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });

  try {
    // Verify this subscription belongs to the current user
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id,     subscriptionId),
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.status, "active"),
        )
      )
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found or not active" }, { status: 404 });
    }

    // Mark as cancelled — access continues until nextBillingDate
    await db
      .update(subscriptions)
      .set({
        status:            "cancelled",
        cancelledAt:       new Date(),
        updatedAt:         new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. You'll keep access until your current period ends.",
      accessUntil: sub.nextBillingDate,
    });
  } catch (e: any) {
    console.error("[POST /api/subscriptions/cancel]", e?.message);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}