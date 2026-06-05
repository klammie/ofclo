// app/api/notifications/read-all/route.ts  — POST mark all read
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { markAllRead } from "@/lib/notifications.service";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const markedCount = await markAllRead(session.user.id);
    return NextResponse.json({ success: true, markedCount });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}