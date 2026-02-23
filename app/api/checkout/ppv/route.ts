import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, posts, ppvUnlocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createCheckout, generateOrderId } from "@/lib/maxelpay";

const WEBHOOK_BASE = process.env.NEXT_PUBLIC_URL!;

export async function POST(req: NextRequest) {
  const sessionData = await auth.api.getSession({ headers: req.headers });
  if (!sessionData || !sessionData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session, user: authUser } = sessionData;

  const { postId } = await req.json() as { postId: string };

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post || !post.isLocked || !post.ppvPrice) {
    return NextResponse.json({ error: "Post not found or not a PPV post" }, { status: 404 });
  }

  const [existing] = await db
    .select()
    .from(ppvUnlocks)
    .where(and(eq(ppvUnlocks.userId, authUser.id), eq(ppvUnlocks.postId, postId)))
    .limit(1);

  if (existing?.paymentStatus === "completed") {
    return NextResponse.json({ alreadyUnlocked: true });
  }

  const [userRow] = await db.select().from(user).where(eq(user.id, authUser.id)).limit(1);

  const orderId   = generateOrderId("ppv", authUser.id);
  const amountUsd = Number(post.ppvPrice);

  await db.insert(ppvUnlocks).values({
    userId:          authUser.id,
    postId,
    amountPaid:      amountUsd.toFixed(2),
    maxelpayOrderId: orderId,
    paymentStatus:   "initiated",
  });

  const checkout = await createCheckout({
    orderId,
    amountUsd,
    userEmail:   userRow.email,
    userName:    userRow.name ?? "",
    redirectUrl: `${WEBHOOK_BASE}/dashboard/user?ppv=success&postId=${postId}`,
    cancelUrl:   `${WEBHOOK_BASE}/dashboard/user?ppv=cancelled&postId=${postId}`,
    webhookUrl:  `${WEBHOOK_BASE}/api/webhooks/maxelpay/ppv`,
  });

  return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, orderId });
}