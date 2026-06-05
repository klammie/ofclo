// app/api/shop/mystery-box/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { openMysteryBox } from "@/lib/mystery-box.service";
import type { MysteryBoxType } from "@/lib/types";

const VALID_BOX_TYPES: MysteryBoxType[] = ["creator", "gifts_badges", "boosters"];

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { boxType } = body as { boxType: MysteryBoxType };

  if (!boxType || !VALID_BOX_TYPES.includes(boxType)) {
    return NextResponse.json(
      { error: "Invalid box type. Must be one of: creator, gifts_badges, boosters" },
      { status: 400 }
    );
  }

  try {
    const result = await openMysteryBox(session.user.id, boxType);
    return NextResponse.json(result);
  } catch (e: any) {
    const statusMap: Record<string, number> = {
      INSUFFICIENT_COINS: 402,
      INVALID_BOX:        400,
    };
    return NextResponse.json(
      { error: e.message, success: false },
      { status: statusMap[e.message] ?? 500 }
    );
  }
}