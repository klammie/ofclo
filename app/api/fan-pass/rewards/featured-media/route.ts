// app/api/fan-pass/rewards/featured-media/route.ts
// GET ?seasonId=xxx&rewardId=xxx — returns the randomly-assigned (and locked-in)
// featured creator post for an "exclusive_content" type reward.
//
// Call this AFTER a reward has been claimed (or to preview what a VIP user
// would unlock) to render the actual photo/video in the reward card / modal.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getFeaturedRewardMedia } from "@/lib/feature-creator-rewards.service";
import { getUserIsFanPassVip } from "@/lib/fanpass-vip-status.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId");
  const rewardId = searchParams.get("rewardId");

  if (!seasonId || !rewardId) {
    return NextResponse.json({ error: "seasonId and rewardId required" }, { status: 400 });
  }

  try {
    const isVip = await getUserIsFanPassVip(session.user.id, Number(seasonId));

    const media = await getFeaturedRewardMedia(
      session.user.id,
      Number(seasonId),
      Number(rewardId),
      isVip,
    );

    if (!media) {
      return NextResponse.json({ error: "No featured media available" }, { status: 404 });
    }

    return NextResponse.json({ media });
  } catch (e: any) {
    console.error("[GET /api/fan-pass/rewards/featured-media]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}