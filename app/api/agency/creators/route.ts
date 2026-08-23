// app/api/agency/creators/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { creators, profiles, user, agencies } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getAgencyId(userId: string): Promise<string> {
  const [agency] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(eq(agencies.userId, userId))
    .limit(1);

  if (!agency) throw new Error("Agency not found for this user");
  return agency.id;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [agency] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(eq(agencies.userId, session.user.id))
    .limit(1);

  if (!agency) return NextResponse.json({ creators: [] });

  try {
    const rows = await db
      .select({
        creatorId: creators.id,
        userId:    creators.userId,
        name:      user.name,
        username:  profiles.username,
        avatarUrl: profiles.avatarUrl,
      })
      .from(creators)
      .innerJoin(user,    eq(user.id,     creators.userId))
      .leftJoin(profiles, eq(profiles.id, creators.userId))
      .where(eq(creators.agencyId, agency.id));

    return NextResponse.json({ creators: rows });
  } catch (e: any) {
    console.error("[api/agency/creators] ERROR:", e?.message ?? e);
    return NextResponse.json({ error: "Failed to fetch creators" }, { status: 500 });
  }
}



