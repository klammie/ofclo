// app/api/notifications/route.ts  — GET notifications
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserNotifications } from "@/lib/notifications.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = parseInt(searchParams.get("limit") ?? "30");

  try {
    const data = await getUserNotifications(session.user.id, limit, cursor);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[GET /api/notifications]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}