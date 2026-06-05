// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user WITH password
    const [newUser] = await db
      .insert(user)
      .values({
        name,
        email,
        emailVerified: false,
        image: null,
        role: "user",
        password: hashedPassword, // ✅ SAVE HASHED PASSWORD
      })
      .returning();

    // Create profile
    const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    
    await db.insert(profiles).values({
      id: newUser.id,
      username: `${username}${Date.now()}`,
      bio: null,
      avatarUrl: newUser.image,
      coverUrl: null,
      location: null,
      website: null,
    });

    console.log(`[Signup] New user created: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("[Signup] Error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}