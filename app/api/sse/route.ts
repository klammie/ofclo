import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { conversations, notifications } from "@/db/schema";
import { or, eq, and, sql } from "drizzle-orm";

export const runtime = "nodejs"; // required for SSE

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        try {
          controller.enqueue(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          );
        } catch {}
      };

      // Send initial counts immediately on connect
      async function pushCounts() {
        try {
          const [[msgResult], [notifResult]] = await Promise.all([
            db
              .select({
                count: sql<number>`
                  COALESCE(SUM(
                    CASE WHEN ${conversations.participant1Id} = ${userId}
                      THEN ${conversations.unreadCountUser1}
                      ELSE ${conversations.unreadCountUser2}
                    END
                  ), 0)::int`,
              })
              .from(conversations)
              .where(
                or(
                  eq(conversations.participant1Id, userId),
                  eq(conversations.participant2Id, userId),
                )
              ),
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(notifications)
              .where(
                and(
                  eq(notifications.userId, userId),
                  eq(notifications.isRead, false),
                )
              ),
          ]);

          send("counts", {
            messages:      msgResult?.count      ?? 0,
            notifications: notifResult?.count    ?? 0,
          });
        } catch {}
      }

      await pushCounts();

      // Poll every 60s (server-side, much cheaper than client polling)
      const interval = setInterval(pushCounts, 60_000);

      // Heartbeat every 25s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try { controller.enqueue(": heartbeat\n\n"); } catch {}
      }, 25_000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // disable Nginx buffering
    },
  });
}