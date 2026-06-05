// app/api/agency/creators/create/route.ts
// POST — Agency creates a new creator account directly.
// Creates: user row, profile row, creator row, sends welcome email.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, profiles, creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// Placeholder — replace with real agency lookup
async function getAgencyId(userId: string): Promise<string> {
  return userId;
}

// Slugify a name into a username
function toUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 30);
}

// Make a username unique by appending a random suffix if taken
async function uniqueUsername(base: string): Promise<string> {
  let username = base;
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.username, username),
    });
    if (!existing) return username;
    username = `${base}_${Math.random().toString(36).slice(2, 6)}`;
    attempts++;
  }
  return `${base}_${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencyId = await getAgencyId(session.user.id);

  const body = await req.json().catch(() => ({}));
  const {
    name,
    email,
    username: rawUsername,
    bio,
    standardPrice, // in dollars e.g. 9.99
    vipPrice,
    avatarUrl,
    coverUrl,
    location,
    website,
    sendWelcomeEmail = true,
  } = body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name?.trim())  return NextResponse.json({ error: "name is required" },  { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: "email is required" }, { status: 400 });

  // Check email not already taken
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email.toLowerCase().trim()),
  });
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  // Build username
  const baseUsername = rawUsername?.trim()
    ? rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    : toUsername(name.trim());
  const username = await uniqueUsername(baseUsername);

  try {
    // ── 1. Create user row ───────────────────────────────────────────────────
    const newUserId = randomUUID();

    await db.insert(user).values({
      id:            newUserId,
      name:          name.trim(),
      email:         email.toLowerCase().trim(),
      role:          "creator",
      emailVerified: false,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    });

    // ── 2. Create profile ────────────────────────────────────────────────────
    await db.insert(profiles).values({
      id:        newUserId,
      username,
      bio:       bio?.trim()       ?? null,
      avatarUrl: avatarUrl?.trim() ?? null,
      coverUrl:  coverUrl?.trim()  ?? null,
      location:  location?.trim()  ?? null,
      website:   website?.trim()   ?? null,
    });

    // ── 3. Create creator record ─────────────────────────────────────────────
    const [creator] = await db.insert(creators).values({
      id:             randomUUID(),
      userId:         newUserId,
      agencyId,                              // link to agency
      bio:            bio?.trim()            ?? null,
      standardPrice:  standardPrice != null
                        ? Math.round(Number(standardPrice) * 100)  // store cents
                        : null,
      vipPrice:       vipPrice != null
                        ? String(Number(vipPrice).toFixed(2))
                        : null,
      isVerified:     false,
      status:         "active",             // agency-created creators are active immediately
      subscriberCount: 0,
      postCount:       0,
      createdAt:       new Date(),
      updatedAt:       new Date(),
    }).returning();

    // ── 4. Send welcome/invite email (fire-and-forget) ───────────────────────
    if (sendWelcomeEmail) {
      // Generate a password-reset token so they can set their own password
      // This calls Better Auth's internal token generation
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/forget-password`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: email.toLowerCase().trim() }),
        });
      } catch (e) {
        console.warn("[agency/creators/create] Could not send welcome email:", e);
      }
    }

    console.log(`[agency/creators/create] Created creator ${newUserId} (${username}) for agency ${agencyId}`);

    return NextResponse.json({
      success: true,
      creator: {
        userId:   newUserId,
        username,
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        creatorId: creator.id,
      },
    }, { status: 201 });

  } catch (e: any) {
    console.error("[agency/creators/create] ERROR:", e?.message ?? e);

    // Clean up partial inserts if something failed
    try {
      await db.delete(user).where(eq(user.email, email.toLowerCase().trim()));
    } catch {}

    return NextResponse.json(
      { error: "Failed to create creator", detail: e?.message },
      { status: 500 }
    );
  }
}