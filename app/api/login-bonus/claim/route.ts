import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DayReward } from "@/lib/types";
import type { ApiError } from "@/lib/types";
import { claimDailyReward } from "@/lib/login-bonus.service";

async function checkIsVip(userId: string): Promise<boolean> {
  // Same VIP check as in GET route — extract to a shared util when ready
  return false;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    const err: ApiError = { error: "Unauthorized", code: "UNAUTHORIZED" };
    return NextResponse.json(err, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const seasonId = parseInt(body.seasonId ?? "1");

  try {
    const isVip = await checkIsVip(session.user.id);
    const result = await claimDailyReward(session.user.id, seasonId, isVip);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e.message === "ALREADY_CLAIMED") {
      const err: ApiError = {
        error: "Already claimed today's reward.",
        code: "ALREADY_CLAIMED",
      };
      return NextResponse.json(err, { status: 409 });
    }
    console.error("[POST /api/login-bonus/claim]", e);
    const err: ApiError = { error: "Server error", code: "SERVER_ERROR" };
    return NextResponse.json(err, { status: 500 });
  }
}