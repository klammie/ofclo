// app/api/fan-pass/season/quest-progress/route.ts
// GET ?seasonId=xxx — returns the user's live progress for each of today's tasks.
// Merge this with the /season/tasks response on the frontend to show real
// "2 of 3" progress bars instead of always starting at 0.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { userQuestProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId");
  if (!seasonId) return NextResponse.json({ error: "seasonId required" }, { status: 400 });

  const sid = parseInt(seasonId);
  if (isNaN(sid)) return NextResponse.json({ error: "Invalid seasonId" }, { status: 400 });

  try {
    const reset = todayKey();

    const rows = await db
      .select()
      .from(userQuestProgress)
      .where(
        and(
          eq(userQuestProgress.userId,   session.user.id),
          eq(userQuestProgress.seasonId, sid),
          eq(userQuestProgress.resetKey, reset),
        )
      );

    // Return as a map keyed by taskId for easy frontend lookup
    const progressMap: Record<number, { current: number; target: number; isCompleted: boolean; rewardClaimed: boolean }> = {};
    for (const row of rows) {
      progressMap[row.taskId] = {
        current:       row.current,
        target:        row.target,
        isCompleted:   row.isCompleted,
        rewardClaimed: row.rewardClaimed,
      };
    }

    return NextResponse.json({ progress: progressMap, resetKey: reset });
  } catch (e: any) {
    console.error("[GET /api/fan-pass/season/quest-progress]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}