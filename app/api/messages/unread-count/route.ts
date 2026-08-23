// app/api/messages/unread-count/route.ts
// Uses conversations table so count always matches ConversationList badges

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { or, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ count: 0 });

  try {
    const [result] = await db
      .select({
        count: sql<number>`
          COALESCE(SUM(
            CASE
              WHEN ${conversations.participant1Id} = ${session.user.id}
                THEN ${conversations.unreadCountUser1}
              ELSE ${conversations.unreadCountUser2}
            END
          ), 0)::int
        `,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, session.user.id),
          eq(conversations.participant2Id, session.user.id),
        )
      );

    return NextResponse.json({ count: result?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}