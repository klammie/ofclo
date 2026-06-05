import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { upsertMilestone, deleteMilestone } from "@/lib/agency-fanpass.service";
import { db } from "@/db";
import { loginStreakMilestone } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getAgencyId(userId: string) { return userId; }

type Params = { params: Promise<{ milestoneId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const { milestoneId } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const existing = await db.query.loginStreakMilestone.findFirst({
      where: eq(loginStreakMilestone.id, parseInt(milestoneId)),
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await upsertMilestone(existing.seasonId, agencyId, { ...body, streakDays: body.streakDays ?? existing.streakDays });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const { milestoneId } = await params;
  try {
    await deleteMilestone(parseInt(milestoneId), agencyId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}