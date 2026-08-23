// app/api/subscriptions/subscribe/route.ts
//
// Creates a real subscription row matching your actual schema:
//   subscriptions (id, userId, creatorId, tier, status, priceAtSubscription,
//                  currentPeriodStart, currentPeriodEnd, ...)
//
// Applies the Fan Pass VIP discount automatically when the creator is the
// active season's featured creator and the subscriber has Fan Pass VIP.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, creators, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSubscriptionPrice } from "@/lib/subscription-pricing.service";
// import { sendNewSubscriberEmail, sendSubscriptionConfirmEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { creatorId, tier } = body as { creatorId: string; tier: "standard" | "vip" };

  if (!creatorId || !tier) {
    return NextResponse.json({ error: "Missing creatorId or tier" }, { status: 400 });
  }

  try {
    // ── Check for an existing active subscription (unique constraint) ────────
    const existing = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId,    session.user.id),
        eq(subscriptions.creatorId, creatorId),
      ),
    });
    if (existing && existing.status === "active") {
      return NextResponse.json({ error: "You're already subscribed to this creator" }, { status: 409 });
    }

    // ── Fetch creator + their user record ─────────────────────────────────────
    const creatorRow = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });
    if (!creatorRow) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

    const creatorUser = await db.query.user.findFirst({
      where: eq(user.id, creatorRow.userId),
    });
    if (!creatorUser) return NextResponse.json({ error: "Creator user not found" }, { status: 404 });

    // ── Compute price — applies Fan Pass VIP discount if eligible ────────────
    const pricing = await getSubscriptionPrice(session.user.id, creatorId, tier);

    // ── Create the subscription row — matches YOUR actual schema ─────────────
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const [newSub] = await db.insert(subscriptions).values({
      userId:              session.user.id,
      creatorId,
      tier,
      status:              "active",
      priceAtSubscription: pricing.finalPrice.toFixed(2), // decimal column expects a string
      paymentStatus:       "initiated", // adjust once your payment flow confirms
      currentPeriodStart:  now,
      currentPeriodEnd:    periodEnd,
    }).returning();

    // ── TODO: send confirmation emails once your email helpers are wired ─────
    // await Promise.allSettled([
    //   sendNewSubscriberEmail({ creatorEmail: creatorUser.email, ... }),
    //   sendSubscriptionConfirmEmail({ subscriberEmail: session.user.email, ... }),
    // ]);

    console.log(`[subscribe] ${session.user.id} → ${creatorUser.name} (${tier}) @ $${pricing.finalPrice}${pricing.discountApplied ? ` (${pricing.discountPct}% VIP discount applied)` : ""}`);

    return NextResponse.json({
      success: true,
      subscription: newSub,
      pricing,
      message: pricing.discountApplied
        ? `Subscribed to ${creatorUser.name} for $${pricing.finalPrice.toFixed(2)}/mo (${pricing.discountPct}% Fan Pass VIP discount applied!)`
        : `Subscribed to ${creatorUser.name} for $${pricing.finalPrice.toFixed(2)}/mo`,
    });

  } catch (e: any) {
    console.error("[POST /api/subscriptions/subscribe]", e?.message ?? e);
    return NextResponse.json({ error: "Server error", detail: e?.message }, { status: 500 });
  }
}