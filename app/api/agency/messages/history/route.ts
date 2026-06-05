// app/api/agency/messages/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { or, and, eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const creatorUserId = searchParams.get("creatorUserId");
    const subscriberUserId = searchParams.get("subscriberUserId");

    if (!creatorUserId || !subscriberUserId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Get message history
    const messageHistory = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.fromUserId, creatorUserId),
            eq(messages.toUserId, subscriberUserId)
          ),
          and(
            eq(messages.fromUserId, subscriberUserId),
            eq(messages.toUserId, creatorUserId)
          )
        )
      )
      .orderBy(messages.createdAt);

    // Mark messages as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.fromUserId, subscriberUserId),
          eq(messages.toUserId, creatorUserId),
          eq(messages.isRead, false)
        )
      );

    return NextResponse.json({ messages: messageHistory });
  } catch (err) {
    console.error("[Get Message History] Error:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}