// app/api/agency/messages/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { messages, user, profiles } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { session, error } = await assertRole(req, "agency");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const creatorUserId = searchParams.get("creatorUserId");

    if (!creatorUserId) {
      return NextResponse.json({ error: "Creator user ID required" }, { status: 400 });
    }

    // Get all conversations for this creator
    const conversations = await db.execute<{
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  last_message: string | null;
  last_message_time: Date | null;
  last_message_sender_id: string | null;   // 👈 add this
  unread_count: number;
}>(sql`
  WITH conversation_users AS (
    SELECT DISTINCT
      CASE 
        WHEN from_user_id = ${creatorUserId} THEN to_user_id
        ELSE from_user_id
      END as user_id
    FROM ${messages}
    WHERE from_user_id = ${creatorUserId} OR to_user_id = ${creatorUserId}
  )
  SELECT 
    cu.user_id,
    u.name as user_name,
    p.avatar_url as user_avatar,
    (
      SELECT content FROM ${messages} m
      WHERE (m.from_user_id = ${creatorUserId} AND m.to_user_id = cu.user_id)
         OR (m.from_user_id = cu.user_id AND m.to_user_id = ${creatorUserId})
      ORDER BY m.created_at DESC
      LIMIT 1
    ) as last_message,
    (
      SELECT created_at FROM ${messages} m
      WHERE (m.from_user_id = ${creatorUserId} AND m.to_user_id = cu.user_id)
         OR (m.from_user_id = cu.user_id AND m.to_user_id = ${creatorUserId})
      ORDER BY m.created_at DESC
      LIMIT 1
    ) as last_message_time,
    (
      SELECT from_user_id FROM ${messages} m
      WHERE (m.from_user_id = ${creatorUserId} AND m.to_user_id = cu.user_id)
         OR (m.from_user_id = cu.user_id AND m.to_user_id = ${creatorUserId})
      ORDER BY m.created_at DESC
      LIMIT 1
    ) as last_message_sender_id,
    (
      SELECT COUNT(*)::int FROM ${messages} m
      WHERE m.from_user_id = cu.user_id 
        AND m.to_user_id = ${creatorUserId}
        AND m.is_read = false
    ) as unread_count
  FROM conversation_users cu
  JOIN ${user} u ON cu.user_id = u.id
  LEFT JOIN ${profiles} p ON u.id = p.id
  ORDER BY last_message_time DESC NULLS LAST
`);


    return NextResponse.json({ conversations: conversations.rows });
  } catch (err) {
    console.error("[Get Conversations] Error:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}