import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateReward, deleteReward } from "@/lib/agency-fanpass.service";

async function getAgencyId(userId: string) { return userId; }

type Params = { params: Promise<{ rewardId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const { rewardId } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const reward = await updateReward(parseInt(rewardId), agencyId, body);
    return NextResponse.json({ reward });
  } catch (e: any) {
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const { rewardId } = await params;
  try {
    await deleteReward(parseInt(rewardId), agencyId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}