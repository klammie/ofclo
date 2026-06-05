// app/api/subscriptions/renew/route.ts
// Re-activates a cancelled subscription by setting status back to active
// and pushing nextBillingDate forward one month.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, creators, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscriptionId } = await req.json().catch(() => ({}));
  if (!subscriptionId) return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });

  try {
    // Verify this subscription belongs to the current user and is cancelled
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id,     subscriptionId),
          eq(subscriptions.userId, session.user.id),
        )
      )
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    if (sub.status === "active") {
      return NextResponse.json({ error: "Subscription is already active" }, { status: 409 });
    }

    // Push billing date forward one month from today
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    await db
      .update(subscriptions)
      .set({
        status:          "active",
        cancelledAt:     null,
        nextBillingDate: nextBilling,
        updatedAt:       new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    return NextResponse.json({
      success:        true,
      message:        "Subscription renewed successfully!",
      nextBillingDate: nextBilling.toISOString(),
    });
  } catch (e: any) {
    console.error("[POST /api/subscriptions/renew]", e?.message);
    return NextResponse.json({ error: "Failed to renew subscription" }, { status: 500 });
  }
}