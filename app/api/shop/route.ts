import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getShopItems, getUserCoinBalance } from "@/lib/shop.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [items, coins] = await Promise.all([
      getShopItems(session.user.id),
      getUserCoinBalance(session.user.id),
    ]);
    return NextResponse.json({ items, coins });
  } catch (e) {
    console.error("[GET /api/shop]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}