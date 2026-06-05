// app/api/agency/fan-pass/seasons/[seasonId]/tasks/route.ts
// POST — bulk create tasks for a season
// GET  — list tasks for a season

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { seasonTasks, fanPassSeasons } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function getAgencyId(userId: string) { return userId; } // placeholder

type Params = { params: Promise<{ seasonId: string }> };

// ─── GET — list tasks ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencyId = await getAgencyId(session.user.id);
  const { seasonId } = await params;
  const sid = parseInt(seasonId);

  try {
    const tasks = await db.query.seasonTasks.findMany({
      where: eq(seasonTasks.seasonId, sid),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });
    return NextResponse.json({ tasks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST — bulk create tasks ─────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencyId = await getAgencyId(session.user.id);
  const { seasonId } = await params;
  const sid = parseInt(seasonId);

  // Verify agency owns this season
  const season = await db.query.fanPassSeasons.findFirst({
    where: and(eq(fanPassSeasons.id, sid), eq(fanPassSeasons.agencyId, agencyId)),
  });
  if (!season) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const tasks: any[] = body.tasks ?? [];

  if (tasks.length === 0) return NextResponse.json({ tasks: [] });

  try {
    // Delete existing tasks for this season then re-insert
    await db.delete(seasonTasks).where(eq(seasonTasks.seasonId, sid));

    const inserted = await db.insert(seasonTasks).values(
      tasks.map((t, idx) => ({
        seasonId:    sid,
        icon:        t.icon        ?? "🎯",
        label:       t.label,
        description: t.description ?? null,
        taskType:    t.taskType    ?? "custom",
        xpReward:    t.xpReward    ?? 50,
        coinReward:  t.coinReward  ?? 10,
        isVipOnly:   t.isVipOnly   ?? false,
        sortOrder:   idx,
        isActive:    true,
      }))
    ).returning();

    return NextResponse.json({ tasks: inserted }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/agency/fan-pass/seasons/tasks]", e?.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE — remove a single task ───────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencyId = await getAgencyId(session.user.id);
  const { seasonId } = await params;
  const sid = parseInt(seasonId);

  const season = await db.query.fanPassSeasons.findFirst({
    where: and(eq(fanPassSeasons.id, sid), eq(fanPassSeasons.agencyId, agencyId)),
  });
  if (!season) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { taskId } = await req.json().catch(() => ({}));
  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  await db.delete(seasonTasks).where(eq(seasonTasks.id, taskId));
  return NextResponse.json({ success: true });
}