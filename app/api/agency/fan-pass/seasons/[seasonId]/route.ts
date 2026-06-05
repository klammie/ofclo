// app/api/agency/fan-pass/seasons/[seasonId]/route.ts
// PATCH — Go Live, End Season, or edit season fields
// DELETE — delete a draft or ended season
// GET    — fetch a single season

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fanPassSeasons } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function getAgencyId(userId: string): Promise<string> {
  return userId; // placeholder — replace with real agency lookup
}

async function assertOwns(seasonId: number, agencyId: string) {
  const season = await db.query.fanPassSeasons.findFirst({
    where: and(
      eq(fanPassSeasons.id, seasonId),
      eq(fanPassSeasons.agencyId, agencyId),
    ),
  });
  if (!season) throw new Error("FORBIDDEN");
  return season;
}

type Params = { params: Promise<{ seasonId: string }> };

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const { seasonId } = await params;
  const sid = parseInt(seasonId);
  if (isNaN(sid)) return NextResponse.json({ error: "Invalid seasonId" }, { status: 400 });
  try {
    const season = await assertOwns(sid, agencyId);
    return NextResponse.json({ season });
  } catch (e: any) {
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const { seasonId } = await params;
  const sid = parseInt(seasonId);
  if (isNaN(sid)) return NextResponse.json({ error: "Invalid seasonId" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  try {
    await assertOwns(sid, agencyId);

    // Status change (Go Live / End)
    if (body.status !== undefined) {
      if (!["draft", "active", "ended"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      // Deactivate any currently active season before going live
      if (body.status === "active") {
        await db
          .update(fanPassSeasons)
          .set({ status: "ended", updatedAt: new Date() })
          .where(and(eq(fanPassSeasons.agencyId, agencyId), eq(fanPassSeasons.status, "active")));
      }
      const [updated] = await db
        .update(fanPassSeasons)
        .set({ status: body.status, updatedAt: new Date() })
        .where(eq(fanPassSeasons.id, sid))
        .returning();
      return NextResponse.json({ success: true, season: updated });
    }

    // Field update
    const ALLOWED = new Set(["name","description","startDate","endDate","vipPriceCents","vipPriceCoins","maxLevel","xpPerLevel"]);
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) updates[k] = v;
    }
    const [season] = await db
      .update(fanPassSeasons)
      .set(updates)
      .where(eq(fanPassSeasons.id, sid))
      .returning();
    return NextResponse.json({ success: true, season });

  } catch (e: any) {
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[PATCH /api/agency/fan-pass/seasons/:id]", e?.message ?? e);
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const { seasonId } = await params;
  const sid = parseInt(seasonId);
  if (isNaN(sid)) return NextResponse.json({ error: "Invalid seasonId" }, { status: 400 });
  try {
    const season = await assertOwns(sid, agencyId);
    if (season.status === "active") {
      return NextResponse.json({ error: "Cannot delete an active season — end it first." }, { status: 409 });
    }
    await db.delete(fanPassSeasons).where(eq(fanPassSeasons.id, sid));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[DELETE /api/agency/fan-pass/seasons/:id]", e?.message ?? e);
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}