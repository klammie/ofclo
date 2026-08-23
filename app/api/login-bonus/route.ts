import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getLoginBonusData } from "@/lib/login-bonus.service";
import { getUserIsFanPassVip } from "@/lib/fanpass-vip-status.service";
import type { ApiError } from "@/lib/types";

export async function GET(req: NextRequest) {
  // better-auth session check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    const err: ApiError = { error: "Unauthorized", code: "UNAUTHORIZED" };
    return NextResponse.json(err, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const seasonId = parseInt(searchParams.get("seasonId") ?? "1");

  try {
    const isVip = await getUserIsFanPassVip(session.user.id, seasonId);
    const data = await getLoginBonusData(session.user.id, seasonId, isVip);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[GET /api/login-bonus]", e);
    const err: ApiError = { error: "Server error", code: "SERVER_ERROR" };
    return NextResponse.json(err, { status: 500 });
  }
}