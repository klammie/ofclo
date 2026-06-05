// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth"; // Your Better Auth instance

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Find user
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has a password (might be OAuth user)
    if (!existingUser.password) {
      return NextResponse.json(
        { error: "Please log in with Google" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, existingUser.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ✅ Create session using Better Auth
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: req.headers,
    });

    console.log(`[Login] User logged in: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
    });
  } catch (err) {
    console.error("[Login] Error:", err);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}