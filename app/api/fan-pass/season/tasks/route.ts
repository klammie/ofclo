// app/api/fan-pass/season/tasks/route.ts
// GET ?seasonId=xxx — returns TODAY's rotating daily quests for a season.
//
// Daily rotation logic: the agency can create as many tasks as they want for
// a season. Each day, a deterministic subset (size = DAILY_QUEST_COUNT) is
// selected based on the date, so every user sees the same quests on the same
// day, and the set changes automatically at midnight UTC without any cron job.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { seasonTasks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

const DAILY_QUEST_COUNT = 5; // how many quests show per day

// Today's date as YYYY-MM-DD (UTC) — used as a stable seed so the rotation
// only changes once every 24h, not on every request.
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Simple deterministic hash → number, so the same (seasonId, date) pair
// always produces the same shuffle order.
function seededHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Deterministic shuffle using the seed — Fisher-Yates with a seeded PRNG
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
    // Fetch the full pool of tasks created by the agency for this season
    const allTasks = await db
      .select()
      .from(seasonTasks)
      .where(eq(seasonTasks.seasonId, sid))
      .orderBy(asc(seasonTasks.sortOrder));

    // Deterministically rotate: same day + same season = same quests for everyone.
    // Changes automatically once the date rolls over (UTC midnight).
    const today    = todayKey();
    const seed     = seededHash(`${sid}-${today}`);
    const shuffled = seededShuffle(allTasks, seed);
    const todaysTasks = shuffled.slice(0, Math.min(DAILY_QUEST_COUNT, shuffled.length));

    console.log(`[GET /api/fan-pass/season/tasks] seasonId=${sid} date=${today} → ${todaysTasks.length}/${allTasks.length} daily tasks`);

    return NextResponse.json({ tasks: todaysTasks, rotatesOn: today });
  } catch (e: any) {
    console.error("[GET /api/fan-pass/season/tasks]", e?.message ?? e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}