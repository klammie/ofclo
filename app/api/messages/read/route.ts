// app/api/messages/read/route.ts
// POST { fromUserId } — marks all messages from that user as read
// Called when the chat window opens or the user scrolls to bottom.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { messages, conversations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromUserId } = await req.json().catch(() => ({}));
  if (!fromUserId) return NextResponse.json({ error: "fromUserId required" }, { status: 400 });

  try {
    // Mark all unread messages from that user as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.fromUserId, fromUserId),
          eq(messages.toUserId,   session.user.id),
          eq(messages.isRead,     false),
        )
      );

    // Reset unread counter on the conversation row
    const [p1, p2] = [session.user.id, fromUserId].sort();
    const isP1     = session.user.id === p1;

    await db
      .update(conversations)
      .set(
        isP1
          ? { unreadCountUser1: 0, updatedAt: new Date() }
          : { unreadCountUser2: 0, updatedAt: new Date() }
      )
      .where(
        and(
          eq(conversations.participant1Id, p1),
          eq(conversations.participant2Id, p2),
        )
      );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[POST /api/messages/read]", e?.message ?? e);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}