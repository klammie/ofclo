// app/api/user/settings/route.ts  — GET all settings
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserSettings } from "@/lib/settings.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await getUserSettings(
      session.user.id,
      session.user.email,
      session.user.name ?? "User"
    );
    return NextResponse.json(settings);
  } catch (e) {
    console.error("[GET /api/user/settings]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}