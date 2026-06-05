// app/api/messages/unread-count/route.ts
// Called by the Sidebar to get a live unread message count

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { messages, conversations } from "@/db/schema";
import { eq, and, or, gt, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ count: 0 });

  try {
    // Count unread messages where the current user is the recipient
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.toUserId,  session.user.id),
          eq(messages.isRead,    false),
        )
      );

    return NextResponse.json({ count: result?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}