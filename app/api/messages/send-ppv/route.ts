// app/api/messages/send-ppv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { messages } from "@/db/schema";

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator"); // ✅ Only creators
  if (error) return error;

  try {
    const body = await req.json();
    const { toUserId, content, mediaType, mediaUrl, thumbnailUrl, isPpv, ppvPrice } = body;

    console.log("[Send PPV] Creating PPV message:", {
      fromUserId: session.user.id,
      toUserId,
      mediaType,
      mediaUrl,
      isPpv,
      ppvPrice,
    });

    // Create PPV message
    const [message] = await db
      .insert(messages)
      .values({
        fromUserId: session.user.id,
        toUserId,
        content: content || null,
        mediaType,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || mediaUrl,
        isPpv: true,
        ppvPrice: ppvPrice.toString(),
        isRead: false,
      })
      .returning();

    console.log("[Send PPV] Message created:", message.id);

    // TODO: Emit via Socket.IO if you have it
    // io.to(`user:${toUserId}`).emit("receive_message", message);

    return NextResponse.json({
      message: {
        id: message.id,
        fromUserId: message.fromUserId,
        toUserId: message.toUserId,
        content: message.content,
        mediaType: message.mediaType,
        mediaUrl: message.mediaUrl,
        thumbnailUrl: message.thumbnailUrl,
        isPpv: message.isPpv,
        ppvPrice: message.ppvPrice,
        isRead: message.isRead,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    console.error("[Send PPV] Error:", err);
    return NextResponse.json(
      { error: "Failed to send PPV" },
      { status: 500 }
    );
  }
}