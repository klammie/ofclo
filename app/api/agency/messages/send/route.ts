// app/api/agency/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { messages } from "@/db/schema";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { creatorUserId, toUserId, content } = await req.json();

    if (!creatorUserId || !toUserId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Send message
    const [message] = await db
      .insert(messages)
      .values({
        fromUserId: creatorUserId,
        toUserId,
        content,
        isRead: false,
      })
      .returning();

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("[Send Message] Error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}