// app/api/app-counts/route.ts
// Single lightweight route that returns both unread message count
// and unread notification count in one DB round trip.
// Called by useAppCounts hook — replaces all polling.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ messages: 0, notifications: 0 });
  }

  const userId = session.user.id;

  try {
    // Single query — both counts in one round trip
    const result = await db.execute<{
      msg_count:   number;
      notif_count: number;
    }>(sql`
      SELECT
        COALESCE((
          SELECT SUM(
            CASE
              WHEN participant1_id = ${userId}
                THEN unread_count_user1
              ELSE unread_count_user2
            END
          )
          FROM conversations
          WHERE participant1_id = ${userId}
             OR participant2_id = ${userId}
        ), 0)::int AS msg_count,

        COALESCE((
          SELECT COUNT(*)
          FROM notifications
          WHERE user_id = ${userId}
            AND is_read = false
        ), 0)::int AS notif_count
    `);

    const row = result.rows[0];

    return NextResponse.json(
      {
        messages:      row?.msg_count   ?? 0,
        notifications: row?.notif_count ?? 0,
      },
      {
        headers: {
          // Cache privately for 60s — avoids hammering DB on every render
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (e: any) {
    console.error("[GET /api/app-counts]", e?.message ?? e);
    return NextResponse.json({ messages: 0, notifications: 0 });
  }
}