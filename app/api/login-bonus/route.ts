import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LoginBonusData } from "@/lib/types"
import { db } from "@/db";
import { eq } from "drizzle-orm";
import type { ApiError } from "@/lib/types";
import { getLoginBonusData } from "@/lib/login-bonus.service";

// Helper: check if the user has an active VIP fan pass subscription.
// Adjust this query to match your actual subscriptions/fan-pass table.
async function checkIsVip(userId: string): Promise<boolean> {
  // Example — replace with your real table:
  // const sub = await db.query.fanPassSubscriptions.findFirst({
  //   where: and(
  //     eq(fanPassSubscriptions.userId, userId),
  //     eq(fanPassSubscriptions.tier, "vip"),
  //     gt(fanPassSubscriptions.expiresAt, new Date())
  //   ),
  // });
  // return !!sub;
  return false; // placeholder until you wire up your subscription table
}

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
    const isVip = await checkIsVip(session.user.id);
    const data = await getLoginBonusData(session.user.id, seasonId, isVip);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[GET /api/login-bonus]", e);
    const err: ApiError = { error: "Server error", code: "SERVER_ERROR" };
    return NextResponse.json(err, { status: 500 });
  }
}