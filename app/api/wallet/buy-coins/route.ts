// app/api/wallet/buy-coins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { buyCoins } from "@/lib/wallet.service";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const result = await buyCoins(session.user.id, body);
    return NextResponse.json(result);
  } catch (e: any) {
    const statusMap: Record<string, number> = {
      INSUFFICIENT_FUNDS: 402,
      INVALID_AMOUNT: 400,
    };
    return NextResponse.json({ error: e.message }, { status: statusMap[e.message] ?? 500 });
  }
}