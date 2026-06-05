// app/api/wallet/deposit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { initiateDeposit } from "@/lib/wallet.service";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const result = await initiateDeposit(session.user.id, body);
    return NextResponse.json(result);
  } catch (e: any) {
    const status = e.message === "INVALID_AMOUNT" ? 400 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}