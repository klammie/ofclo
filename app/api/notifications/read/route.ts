// app/api/notifications/read/route.ts  — POST mark single read
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { markNotificationRead } from "@/lib/notifications.service";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });

  try {
    await markNotificationRead(body.notificationId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}