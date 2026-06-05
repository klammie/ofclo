import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { saveNotificationPrefs } from "@/lib/settings.service";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const result = await saveNotificationPrefs(session.user.id, body);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[PATCH /api/user/settings/notifications]", e);
    return NextResponse.json({ error: "Server error", success: false }, { status: 500 });
  }
}