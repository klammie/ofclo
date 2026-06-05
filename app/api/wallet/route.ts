// app/api/wallet/route.ts  — GET balance + coin packages
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getWalletBalance, getTransactions, getCoinPackages } from "@/lib/wallet.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "balance";

  try {
    if (view === "transactions") {
      const limit  = parseInt(searchParams.get("limit")  ?? "20");
      const offset = parseInt(searchParams.get("offset") ?? "0");
      const transactions = await getTransactions(session.user.id, limit, offset);
      return NextResponse.json({ transactions });
    }

    if (view === "packages") {
      const packages = await getCoinPackages();
      return NextResponse.json({ packages });
    }

    const [balance, packages] = await Promise.all([
      getWalletBalance(session.user.id),
      getCoinPackages(),
    ]);
    return NextResponse.json({ balance, packages });
  } catch (e) {
    console.error("[GET /api/wallet]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}