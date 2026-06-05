// app/api/auto-messages/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { autoMessages, creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const {
      creatorId,
      triggerType,
      tier,
      messageText,
      mediaUrl,
      mediaType,
      delayMinutes,
    } = await req.json();

    // Validation
    if (!triggerType || !messageText) {
      return NextResponse.json(
        { error: "Trigger type and message text are required" },
        { status: 400 }
      );
    }

    // Verify creator ownership
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator || creator.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create auto message
    const [autoMessage] = await db
      .insert(autoMessages)
      .values({
        creatorId,
        triggerType,
        tier: tier || null,
        messageText,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        delayMinutes: delayMinutes || 0,
        isActive: true,
      })
      .returning();

    console.log(`[Auto Message] Created: ${autoMessage.id} (${triggerType})`);

    return NextResponse.json({ success: true, autoMessage });
  } catch (err) {
    console.error("[Create Auto Message] Error:", err);
    return NextResponse.json(
      { error: "Failed to create auto message" },
      { status: 500 }
    );
  }
}