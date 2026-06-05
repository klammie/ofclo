// app/api/messages/history/route.ts
// GET ?userId=xxx&limit=50&before=<messageId>
// Returns message history between current user and another user.
// Also marks messages as read automatically.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { and, eq, or, desc, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get("userId");
  const limit       = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  if (!otherUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    const history = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.fromUserId, session.user.id),
            eq(messages.toUserId,   otherUserId),
          ),
          and(
            eq(messages.fromUserId, otherUserId),
            eq(messages.toUserId,   session.user.id),
          ),
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    // Return in chronological order (oldest first)
    const ordered = history.reverse().map((m) => ({
      id:          m.id,
      fromUserId:  m.fromUserId,
      toUserId:    m.toUserId,
      content:     m.content,
      mediaType:   m.mediaType,
      mediaUrl:    m.mediaUrl,
      isPpv:       m.isPpv,
      ppvPrice:    m.ppvPrice,
      isRead:      m.isRead,
      createdAt:   m.createdAt.toISOString(),
      isUnlocked:  false,
    }));

    // Auto-mark as read in background
    db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.fromUserId, otherUserId),
          eq(messages.toUserId,   session.user.id),
          eq(messages.isRead,     false),
        )
      )
      .catch(() => null);

    return NextResponse.json({ messages: ordered });

  } catch (e: any) {
    console.error("[GET /api/messages/history]", e?.message ?? e);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}