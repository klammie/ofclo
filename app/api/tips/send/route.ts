// app/api/tips/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { tips, creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "user", "creator", "agency");
  if (error) return error;

  try {
    const { creatorId, amount, message, postId, messageId } = await req.json();

    // Validation
    if (!creatorId || !amount) {
      return NextResponse.json(
        { error: "Creator ID and amount required" },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Verify creator exists
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Create tip (without payment processing for now)
    const [tip] = await db
      .insert(tips)
      .values({
        fromUserId: session.user.id,
        toCreatorId: creatorId,
        postId: postId || null,
        messageId: messageId || null,
        amount: amount.toString(),
        message: message || null,
        status: "completed", // Will be "pending" when payment is integrated
      })
      .returning();

    console.log(`[Tip] User ${session.user.id} tipped creator ${creatorId} $${amount}`);

    return NextResponse.json({
      success: true,
      tip: {
        id: tip.id,
        amount: parseFloat(tip.amount),
        createdAt: tip.createdAt,
      },
    });
  } catch (err) {
    console.error("[Send Tip] Error:", err);
    return NextResponse.json(
      { error: "Failed to send tip" },
      { status: 500 }
    );
  }
}