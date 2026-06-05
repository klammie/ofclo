// app/api/fan-pass/season/tasks/route.ts
// GET ?seasonId=xxx — returns tasks for a season, available to any logged-in user

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { seasonTasks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId");

  if (!seasonId) return NextResponse.json({ error: "seasonId required" }, { status: 400 });

  const sid = parseInt(seasonId);
  if (isNaN(sid)) return NextResponse.json({ error: "Invalid seasonId" }, { status: 400 });

  try {
    // Use db.select() directly — works even if seasonTasks isn't in Drizzle relations config
    const tasks = await db
      .select()
      .from(seasonTasks)
      .where(eq(seasonTasks.seasonId, sid))
      .orderBy(asc(seasonTasks.sortOrder));

    console.log(`[GET /api/fan-pass/season/tasks] seasonId=${sid} → ${tasks.length} tasks`);

    return NextResponse.json({ tasks });
  } catch (e: any) {
    console.error("[GET /api/fan-pass/season/tasks]", e?.message ?? e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}