// app/api/agency/creators/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, profiles, creators, agencies, account, agencyCreators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

async function getAgencyId(userId: string): Promise<string> {
  const [agency] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(eq(agencies.userId, userId))
    .limit(1);

  if (!agency) throw new Error("Agency not found for this user");
  return agency.id;
}

function toUsername(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s_]/g, "").trim().replace(/\s+/g, "_").slice(0, 30);
}

async function uniqueUsername(base: string): Promise<string> {
  let username = base;
  for (let i = 0; i < 10; i++) {
    const existing = await db.query.profiles.findFirst({ where: eq(profiles.username, username) });
    if (!existing) return username;
    username = `${base}_${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}_${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencyId = await getAgencyId(session.user.id);
  const body = await req.json().catch(() => ({}));

  const {
    name, email, username: rawUsername, password,
    bio, standardPrice, vipPrice,
    avatarUrl, coverUrl, location, website,
    sendWelcomeEmail = true,
  } = body;

  if (!name?.trim())  return NextResponse.json({ error: "name is required" },  { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: "email is required" }, { status: 400 });
  if (!sendWelcomeEmail && (!password || password.length < 8)) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existingUser = await db.query.user.findFirst({ where: eq(user.email, email.toLowerCase().trim()) });
  if (existingUser) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

  const baseUsername = rawUsername?.trim()
    ? rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    : toUsername(name.trim());
  const username = await uniqueUsername(baseUsername);

  const newUserId = randomUUID();

  try {
    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
console.log("[agency/creators/create] hashedPassword is", hashedPassword ? "SET" : "NULL", "| sendWelcomeEmail:", sendWelcomeEmail, "| password received:", !!password);

// Then make the validation stricter — if no email AND no password, reject early:
if (!sendWelcomeEmail && !hashedPassword) {
  return NextResponse.json({ error: "Password is required when not sending welcome email" }, { status: 400 });
}

    const { user: createdUser } = await auth.api.createUser({
  body: {
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password: password ?? undefined,
    role:     "creator",
    data: {
      emailVerified: true,
    },
  },
});

const newUserId = createdUser.id;

    await db.insert(profiles).values({
      id:        newUserId,
      username,
      bio:       bio?.trim()       ?? null,
      avatarUrl: avatarUrl?.trim() ?? null,
      coverUrl:  coverUrl?.trim()  ?? null,
      location:  location?.trim()  ?? null,
      website:   website?.trim()   ?? null,
    });

    // Both prices stored as integer cents
    const [creator] = await db.insert(creators).values({
      id:              randomUUID(),
      userId:          newUserId,
      agencyId,
      bio:             bio?.trim() ?? null,
      // standardPrice is integer cents
      standardPrice:   standardPrice != null ? Math.round(Number(standardPrice) * 100) : 999,
      // vipPrice is decimal dollars string
      vipPrice:        vipPrice != null ? Number(vipPrice).toFixed(2) : "24.99",
      isVerified:      false,
      status:          "active",
      subscriberCount: 0,
      postCount:       0,
      createdAt:       new Date(),
      updatedAt:       new Date(),
    }).returning();

    await db.insert(agencyCreators).values({
      agencyId:  agencyId,   // the real agency UUID
      creatorId: creator.id,
      createdAt: new Date(),
    }).onConflictDoNothing();

    if (sendWelcomeEmail) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/forget-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.toLowerCase().trim() }),
      }).catch((e) => console.warn("[agency/creators/create] Email error:", e));
    }

    return NextResponse.json({
      success: true,
      creator: {
        userId:    newUserId,
        username,
        name:      name.trim(),
        email:     email.toLowerCase().trim(),
        creatorId: creator.id,
      },
    }, { status: 201 });

  } catch (e: any) {
    console.error("[agency/creators/create] ERROR:", e?.message ?? e);
    // Clean up on failure
    await db.delete(user).where(eq(user.id, newUserId)).catch(() => {});
    return NextResponse.json({ error: "Failed to create creator", detail: e?.message }, { status: 500 });
  }
}