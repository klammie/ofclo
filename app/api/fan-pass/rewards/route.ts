// ── app/api/fan-pass/rewards/route.ts ────────────────────────────────────────
// GET  → get windowed reward track (2 past, current, 2 upcoming)
// POST → claim a reward

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getActiveSeason, getRewardWindow, claimReward } from "@/lib/fan-pass.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const season = await getActiveSeason();
    if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 });

    const window = await getRewardWindow(session.user.id, season.id);
    return NextResponse.json({ window, season });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rewardId } = await req.json().catch(() => ({}));
  if (!rewardId) return NextResponse.json({ error: "rewardId required" }, { status: 400 });

  try {
    const season = await getActiveSeason();
    if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 });

    await claimReward(session.user.id, season.id, rewardId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const statusMap: Record<string, number> = { ALREADY_CLAIMED: 409, NOT_REACHED: 403 };
    return NextResponse.json({ error: e.message }, { status: statusMap[e.message] ?? 500 });
  }
}


// ── app/api/fan-pass/xp-reset/route.ts (admin/cron only) ─────────────────────
// POST → end current season and reset all user XP
// Protect this route — call from a cron job or admin panel only

export async function POST_XP_RESET(req: NextRequest) {
  // Verify admin or internal cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { seasonId } = await req.json().catch(() => ({}));
  if (!seasonId) return NextResponse.json({ error: "seasonId required" }, { status: 400 });

  try {
    const { resetSeasonXp } = await import("@/lib/fan-pass.service");
    const affected = await resetSeasonXp(seasonId);
    return NextResponse.json({ success: true, affectedUsers: affected });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}