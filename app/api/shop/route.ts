import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getShopItems, getUserCoinBalance } from "@/lib/shop.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    console.log("[GET /api/shop] fetching for user:", session.user.id);

    let items: any[] = [];
    let coins = 0;

    try {
      items = await getShopItems(session.user.id);
      console.log("[GET /api/shop] items fetched:", items.length);
    } catch (e: any) {
      console.error("[GET /api/shop] getShopItems failed:", e?.message ?? e);
      // Return empty items instead of 500
      items = [];
    }

    try {
      coins = await getUserCoinBalance(session.user.id);
      console.log("[GET /api/shop] coins fetched:", coins);
    } catch (e: any) {
      console.error("[GET /api/shop] getUserCoinBalance failed:", e?.message ?? e);
      coins = 0;
    }

    return NextResponse.json({ items, coins });
  } catch (e: any) {
    console.error("[GET /api/shop] outer error:", e?.message ?? e);
    return NextResponse.json({ error: "Server error", detail: e?.message }, { status: 500 });
  }
}