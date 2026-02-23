// app/api/checkout/tip/route.ts
// POST — initiates MaxelPay checkout for a tip payment

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";   // ✅ BetterAuth instance
import { db } from "@/db";
import { user, creators, tips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createCheckout, generateOrderId } from "@/lib/maxelpay";

const WEBHOOK_BASE = process.env.NEXT_PUBLIC_URL!;

export async function POST(req: NextRequest) {
  // ✅ BetterAuth session retrieval
  const sessionData = await auth.api.getSession({ headers: req.headers });
  if (!sessionData || !sessionData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session, user: authUser } = sessionData;

  const {
    creatorId,
    amountUsd,
    message,
    isAnonymous,
  } = await req.json() as {
    creatorId:   string;
    amountUsd:   number;
    message?:    string;
    isAnonymous?: boolean;
  };

  if (!creatorId || !amountUsd || amountUsd < 1) {
    return NextResponse.json(
      { error: "creatorId and a minimum amount of $1 are required" },
      { status: 400 }
    );
  }

  const [[creator], [userRow]] = await Promise.all([
    db.select().from(creators).where(eq(creators.id, creatorId)).limit(1),
    db.select().from(user).where(eq(user.id, authUser.id)).limit(1),
  ]);

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const orderId = generateOrderId("tip", authUser.id);

  // ✅ Insert tip record in pending state
  await db.insert(tips).values({
    fromUserId:      authUser.id,
    toCreatorId:     creatorId,
    amount:          amountUsd.toFixed(2),
    message:         message ?? null,
    isAnonymous:     isAnonymous ?? false,
    maxelpayOrderId: orderId,
    paymentStatus:   "initiated",
  });

  // ✅ Create MaxelPay checkout
  const checkout = await createCheckout({
    orderId,
    amountUsd,
    userEmail:   userRow.email,
    userName:    userRow.name ?? "",
    redirectUrl: `${WEBHOOK_BASE}/dashboard/user?tip=success`,
    cancelUrl:   `${WEBHOOK_BASE}/dashboard/user?tip=cancelled`,
    webhookUrl:  `${WEBHOOK_BASE}/api/webhooks/maxelpay/tip`,
  });

  return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, orderId });
}