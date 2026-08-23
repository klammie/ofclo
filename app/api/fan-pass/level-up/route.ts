// app/api/fan-pass/level-up/route.ts
// POST { seasonId, newLevel } — called once by the frontend when LevelUpOverlay
// detects a genuine level increase. Grants a bonus status XP reward on top of
// the XP the user already earned from quests (level-ups are a milestone worth
// celebrating beyond just the sum of quest XP).
//
// Idempotent per (user, season, level) — won't double-grant if called twice.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { statusXpLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { grantStatusXp } from "@/lib/status-xp.service";

// Bonus XP per level-up — scales slightly with level so higher levels feel
// more rewarding. Adjust the curve as needed.
function levelUpBonus(level: number): number {
  return 20 + level * 2;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const { seasonId, newLevel } = body;

  if (!seasonId || !newLevel) {
    return NextResponse.json({ error: "seasonId and newLevel required" }, { status: 400 });
  }

  const sourceRef = `${seasonId}:${newLevel}`;

  try {
    // Idempotency check — has this exact level-up already been rewarded?
    const existing = await db.query.statusXpLog.findFirst({
      where: and(
        eq(statusXpLog.userId,    userId),
        eq(statusXpLog.source,    "fan_pass_levelup"),
        eq(statusXpLog.sourceRef, sourceRef),
      ),
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyGranted: true });
    }

    const bonus = levelUpBonus(Number(newLevel));
    await grantStatusXp(userId, bonus, "fan_pass_levelup", sourceRef, `Reached Fan Pass Level ${newLevel}`);

    return NextResponse.json({ success: true, bonusXp: bonus });
  } catch (e: any) {
    console.error("[POST /api/fan-pass/level-up]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}