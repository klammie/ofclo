// ── app/api/fan-pass/tasks/route.ts ──────────────────────────────────────────
// GET  → get weekly task bundle for current user
// POST → complete a task

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getActiveSeason,
  getWeeklyTasks,
  completeTask,
  getOrCreateSeasonProgress,
} from "@/lib/fan-pass.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const season = await getActiveSeason();
    if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 });

    const progress = await getOrCreateSeasonProgress(session.user.id, season.id);
    const bundle   = await getWeeklyTasks(session.user.id, season.id, progress.isVip);

    return NextResponse.json({ bundle, season, progress });
  } catch (e) {
    console.error("[GET /api/fan-pass/tasks]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await req.json().catch(() => ({}));
  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  try {
    const season = await getActiveSeason();
    if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 });

    const result = await completeTask(session.user.id, season.id, taskId);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    const statusMap: Record<string, number> = { ALREADY_COMPLETED: 409, NO_ASSIGNMENT: 404 };
    return NextResponse.json({ error: e.message }, { status: statusMap[e.message] ?? 500 });
  }
}