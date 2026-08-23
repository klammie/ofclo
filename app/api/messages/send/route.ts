// app/api/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { messages, conversations, profiles, creators, agencies, notifications } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { toUserId, content, mediaUrl, mediaType, isPpv = false, ppvPrice } = body;

  if (!toUserId)
    return NextResponse.json({ error: "toUserId is required" }, { status: 400 });
  if (!content?.trim() && !mediaUrl)
    return NextResponse.json({ error: "content or mediaUrl is required" }, { status: 400 });
  if (content?.length > 2000)
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  if (toUserId === session.user.id)
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  try {
    // ── Insert the message ────────────────────────────────────────────────────
    const [message] = await db
      .insert(messages)
      .values({
        fromUserId: session.user.id,
        toUserId,
        content:    content?.trim() ?? null,
        mediaUrl:   mediaUrl  ?? null,
        mediaType:  mediaType ?? null,
        isPpv,
        ppvPrice:   ppvPrice != null ? String(Number(ppvPrice).toFixed(2)) : null,
        isRead:     false,
        createdAt:  new Date(),
      })
      .returning();

    // ── Upsert conversation row ───────────────────────────────────────────────
    // Sort participant IDs so (A,B) and (B,A) always produce the same row
   

const [p1, p2]   = [session.user.id, toUserId].sort();
const isP1Sender = session.user.id === p1;
const senderPos  = isP1Sender ? 1 : 2; // 1 = p1 sent, 2 = p2 sent
const result = await db.execute(sql`...your upsert...`);
console.log("[send] upsert result:", result.rowCount, "rows affected");

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
    ${content?.trim() ?? null},
    NOW(),
    ${session.user.id},
    ${isP1Sender ? 0 : 1},
    ${isP1Sender ? 1 : 0},
    NOW(), NOW()
  )
  ON CONFLICT (participant1_id, participant2_id) DO UPDATE SET
    last_message_content   = ${content?.trim() ?? null},
    last_message_at        = NOW(),
    last_message_sender_id = ${session.user.id},
    unread_count_user1     = CASE WHEN ${senderPos} = 1
                               THEN conversations.unread_count_user1
                               ELSE conversations.unread_count_user1 + 1
                             END,
    unread_count_user2     = CASE WHEN ${senderPos} = 2
                               THEN conversations.unread_count_user2
                               ELSE conversations.unread_count_user2 + 1
                             END,
    updated_at             = NOW()
`);

    // ── Fetch sender profile for notification ─────────────────────────────────
    const senderProfile = await db.query.profiles?.findFirst?.({
      where: eq(profiles.id, session.user.id),
    });

    const senderName = session.user.name ?? senderProfile?.username ?? "Someone";
    const snippet    = (content?.trim() ?? "📎 Media")
      .slice(0, 60) + ((content?.trim()?.length ?? 0) > 60 ? "…" : "");

    // ── Notify recipient ──────────────────────────────────────────────────────
    try {
      const notifBase = {
        type:      "new_message" as const,
        priority:  "high"        as const,
        title:     `New message from ${senderName}`,
        body:      snippet,
        icon:      "💬",
        actionUrl: `/dashboard/user/message/${session.user.id}`,
        actorId:   session.user.id,
        actorName: senderName,
        entityId:  session.user.id,
        isRead:    false,
        createdAt: new Date(),
      };

      // Notify the recipient
      await db.insert(notifications).values({
        id:     randomUUID(),
        userId: toUserId,
        ...notifBase,
      });

      // If the recipient is a creator, also notify their agency
      const creator = await db.query.creators.findFirst({
        where: eq(creators.userId, toUserId),
        columns: { agencyId: true },
      }).catch(() => null);

      if (creator?.agencyId) {
        const agency = await db.query.agencies.findFirst({
          where: eq(agencies.id, creator.agencyId),
          columns: { userId: true },
        }).catch(() => null);

        if (agency && agency.userId !== session.user.id) {
          await db.insert(notifications).values({
            id:        randomUUID(),
            userId:    agency.userId,
            ...notifBase,
            title:     `${senderName} messaged one of your creators`,
            actionUrl: `/dashboard/agency/creators`,
          });
        }
      }
    } catch (e) {
      console.error("[messages/send] notification error:", e);
    }

    return NextResponse.json({
      message: {
        id:         message.id,
        fromUserId: message.fromUserId,
        toUserId:   message.toUserId,
        content:    message.content,
        mediaType:  message.mediaType,
        mediaUrl:   message.mediaUrl,
        isPpv:      message.isPpv,
        ppvPrice:   message.ppvPrice,
        isRead:     message.isRead,
        createdAt:  message.createdAt
          ? new Date(message.createdAt).toISOString()
          : new Date().toISOString(),
        isUnlocked: false,
      },
    }, { status: 201 });

  } catch (e: any) {
    console.error("[POST /api/messages/send]", e?.message ?? e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}