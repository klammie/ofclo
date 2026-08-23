// app/api/subscriptions/price-preview/route.ts
// GET ?creatorId=xxx&tier=standard|vip — returns the price the current user
// would actually pay, including any Fan Pass VIP discount. Call this before
// showing a "Subscribe for $X" button so the price is always accurate.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubscriptionPrice } from "@/lib/subscription-pricing.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");
  const tier = (searchParams.get("tier") ?? "standard") as "standard" | "vip";

  if (!creatorId) return NextResponse.json({ error: "creatorId required" }, { status: 400 });

  try {
    const pricing = await getSubscriptionPrice(session.user.id, creatorId, tier);
    return NextResponse.json(pricing);
  } catch (e: any) {
    console.error("[GET /api/subscriptions/price-preview]", e?.message);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}