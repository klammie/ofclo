// app/api/messages/unlock-ppv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { ppvPurchases, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "user", "creator");
  if (error) return error;

  try {
    const { messageId } = await req.json();

    // Get message details
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (!message.isPpv) {
      return NextResponse.json({ error: "Not a PPV message" }, { status: 400 });
    }

    // Check if already purchased
    const [existing] = await db
      .select()
      .from(ppvPurchases)
      .where(eq(ppvPurchases.messageId, messageId))
      .limit(1);

    if (existing) {
      return NextResponse.json({ unlocked: true });
    }

    // Process payment (integrate with your payment system)
    // For now, we'll just record the purchase

    await db.insert(ppvPurchases).values({
      messageId,
      userId: session.user.id,
      pricePaid: message.ppvPrice,
    });

    return NextResponse.json({ unlocked: true });
  } catch (err) {
    console.error("[Unlock PPV] Error:", err);
    return NextResponse.json({ error: "Failed to unlock" }, { status: 500 });
  }
}