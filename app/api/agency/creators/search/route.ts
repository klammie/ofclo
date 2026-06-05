// app/api/agency/creators/search/route.ts
// GET ?q=searchTerm — search creators by name or username
// Used by the FeaturedCreatorPicker in CreateSeasonForm

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { creators, user, profiles } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ creators: [] });
  }

  try {
    const rows = await db
      .select({
        userId:   creators.userId,
        name:     user.name,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
        image:    user.image,
      })
      .from(creators)
      .innerJoin(user,    eq(user.id,     creators.userId))
      .leftJoin(profiles, eq(profiles.id, creators.userId))
      .where(
        and(
          eq(creators.status, "active"),
          or(
            ilike(user.name,        `%${q}%`),
            ilike(profiles.username, `%${q}%`),
          )
        )
      )
      .limit(8);

    const results = rows.map((r) => ({
      userId:   r.userId,
      name:     r.name,
      username: r.username ?? r.name.toLowerCase().replace(/\s+/g, "_"),
      avatarUrl: r.avatarUrl ?? r.image ?? null,
    }));

    return NextResponse.json({ creators: results });

  } catch (e: any) {
    console.error("[GET /api/agency/creators/search]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}