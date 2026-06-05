import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { purchaseWithCoins } from "@/lib/shop.service";
import type { ApiPurchaseError } from "@/types/shop";

const ERROR_STATUS: Record<string, number> = {
  INSUFFICIENT_COINS: 402,
  ITEM_NOT_FOUND:     404,
  ALREADY_OWNED:      409,
  OUT_OF_STOCK:       410,
  SERVER_ERROR:       500,
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { itemId, currency = "coins" } = body;

  if (!itemId) return NextResponse.json({ error: "itemId required", code: "ITEM_NOT_FOUND" }, { status: 400 });

  try {
    if (currency === "coins") {
      const result = await purchaseWithCoins(session.user.id, itemId);
      return NextResponse.json(result);
    }
    // Real money purchases → redirect to your payment provider (Stripe etc.)
    return NextResponse.json({ error: "Real money checkout not implemented", code: "SERVER_ERROR" }, { status: 501 });
  } catch (e: any) {
    const code = e.message in ERROR_STATUS ? e.message : "SERVER_ERROR";
    const err: ApiPurchaseError = { error: e.message, code: code as any };
    console.error("[POST /api/shop/purchase]", e);
    return NextResponse.json(err, { status: ERROR_STATUS[code] ?? 500 });
  }
}