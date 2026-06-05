// app/api/messages/send/route.ts
// POST { toUserId, content, mediaUrl?, mediaType?, isPpv?, ppvPrice? }
// Creates a message and upserts the conversation row.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { messages, conversations, profiles, user } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { toUserId, content, mediaUrl, mediaType, isPpv = false, ppvPrice } = body;

  if (!toUserId)          return NextResponse.json({ error: "toUserId is required" },  { status: 400 });
  if (!content?.trim() && !mediaUrl)
                          return NextResponse.json({ error: "content or mediaUrl is required" }, { status: 400 });
  if (content?.length > 2000)
                          return NextResponse.json({ error: "Message too long" },       { status: 400 });
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
        mediaUrl:   mediaUrl ?? null,
        mediaType:  mediaType ?? null,
        isPpv,
        ppvPrice:   ppvPrice != null ? String(Number(ppvPrice).toFixed(2)) : null,
        isRead:     false,
        createdAt:  new Date(), // ← explicit so it's never null
      })
      .returning();

    // ── Upsert conversation row ───────────────────────────────────────────────
    // Conversation is keyed on the two participants in consistent order
    // (lower userId first) so there's always exactly one row per pair.
    const [p1, p2] = [session.user.id, toUserId].sort();

    const existing = await db.query.conversations?.findFirst?.({
      where: and(
        eq(conversations.participant1Id, p1),
        eq(conversations.participant2Id, p2),
      ),
    });

    if (existing) {
      // Update last message + reset unread count for recipient
      const isP1Sender = session.user.id === p1;
      await db
        .update(conversations)
        .set({
          lastMessageContent: content?.trim() ?? null,
          lastMessageAt:      new Date(),
          // Increment unread for the OTHER participant
          ...(isP1Sender
            ? { unreadCountUser2: sql`${conversations.unreadCountUser2} + 1` }
            : { unreadCountUser1: sql`${conversations.unreadCountUser1} + 1` }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(conversations.participant1Id, p1),
            eq(conversations.participant2Id, p2),
          )
        );
    } else {
      // Create new conversation
      const isP1Sender = session.user.id === p1;
      await db.insert(conversations).values({
        participant1Id:     p1,
        participant2Id:     p2,
        lastMessageContent: content?.trim() ?? null,
        lastMessageAt:      new Date(),
        unreadCountUser1:   isP1Sender ? 0 : 1,
        unreadCountUser2:   isP1Sender ? 1 : 0,
      });
    }

    // ── Fetch sender profile for response ─────────────────────────────────────
    const senderProfile = await db.query.profiles?.findFirst?.({
      where: eq(profiles.id, session.user.id),
    });

    return NextResponse.json({
      message: {
        id:          message.id,
        fromUserId:  message.fromUserId,
        toUserId:    message.toUserId,
        content:     message.content,
        mediaType:   message.mediaType,
        mediaUrl:    message.mediaUrl,
        isPpv:       message.isPpv,
        ppvPrice:    message.ppvPrice,
        isRead:      message.isRead,
        createdAt:   message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString(),
        isUnlocked:  false,
      },
    }, { status: 201 });

  } catch (e: any) {
    console.error("[POST /api/messages/send]", e?.message ?? e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}