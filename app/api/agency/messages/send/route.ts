// app/api/agency/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { creatorUserId, toUserId, content } = await req.json();

    if (!creatorUserId || !toUserId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert the message
    const [message] = await db
      .insert(messages)
      .values({
        fromUserId: creatorUserId,
        toUserId,
        content,
        isRead: false,
      })
      .returning();

    // ── Update conversations row so fan sees unread badge ──────────────────
    const [p1, p2]   = [creatorUserId, toUserId].sort();
    const isP1Sender = creatorUserId === p1;
    const senderPos  = isP1Sender ? 1 : 2;

    await db.execute(sql`
      INSERT INTO conversations (
        participant1_id,
        participant2_id,
        last_message_content,
        last_message_at,
        last_message_sender_id,
        unread_count_user1,
        unread_count_user2,
        created_at,
        updated_at
      ) VALUES (
        ${p1}, ${p2},
        ${content.trim()},
        NOW(),
        ${creatorUserId},
        ${isP1Sender ? 0 : 1},
        ${isP1Sender ? 1 : 0},
        NOW(), NOW()
      )
      ON CONFLICT (participant1_id, participant2_id) DO UPDATE SET
        last_message_content   = ${content.trim()},
        last_message_at        = NOW(),
        last_message_sender_id = ${creatorUserId},
        unread_count_user1     = CASE WHEN ${senderPos} = 1
                                   THEN conversations.unread_count_user1
                                   ELSE conversations.unread_count_user1 + 1
                                 END,
        unread_count_user2     = CASE WHEN ${senderPos} = 2
                                   THEN conversations.unread_count_user2
                                   ELSE conversations.unread_count_user2 + 1
                                 END,
        updated_at = NOW()
    `);

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("[Send Message] Error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}