// app/api/auto-messages/[messageId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { autoMessages, creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const { messageId } = await params;

    // Get auto message
    const [autoMsg] = await db
      .select()
      .from(autoMessages)
      .where(eq(autoMessages.id, messageId))
      .limit(1);

    if (!autoMsg) {
      return NextResponse.json({ error: "Auto message not found" }, { status: 404 });
    }

    // Verify ownership
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, autoMsg.creatorId))
      .limit(1);

    if (!creator || creator.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete
    await db
      .delete(autoMessages)
      .where(eq(autoMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Delete Auto Message] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete auto message" },
      { status: 500 }
    );
  }
}