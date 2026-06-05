import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { upsertMilestone, deleteMilestone } from "@/lib/agency-fanpass.service";

async function getAgencyId(userId: string) { return userId; }

// POST /api/agency/fan-pass/milestones — create new
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const body = await req.json().catch(() => ({}));
  try {
    await upsertMilestone(body.seasonId, agencyId, body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}