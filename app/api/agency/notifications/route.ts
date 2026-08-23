// app/api/agency/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { agencies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAgencyNotifications } from "@/lib/queries/agency";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [agency] = await db
    .select()
    .from(agencies)
    .where(eq(agencies.userId, session.user.id))
    .limit(1);

  if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = parseInt(searchParams.get("limit") ?? "50");

  try {
    const data = await getAgencyNotifications(agency.id, limit, cursor);
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("[GET /api/agency/notifications]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — mark a creator notification as read on behalf of agency
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notificationId } = await req.json().catch(() => ({}));
  if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });

  try {
    const { notifications } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to mark read" }, { status: 500 });
  }
}