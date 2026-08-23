// app/api/status/xp/route.ts
// GET — returns the current user's total status XP (sum of statusXpLog).
// Used by the Sidebar (tier badge), StatusModal, and StatusTierUpOverlay.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserStatusXp, getUserStatusXpBreakdown } from "@/lib/status-xp.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const includeBreakdown = searchParams.get("breakdown") === "true";

    const statusXp = await getUserStatusXp(session.user.id);
    const breakdown = includeBreakdown
      ? await getUserStatusXpBreakdown(session.user.id)
      : undefined;

    return NextResponse.json({ statusXp, breakdown });
  } catch (e: any) {
    console.error("[GET /api/status/xp]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}