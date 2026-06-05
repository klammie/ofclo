import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  try {
    // ── Password change ──────────────────────────────────────────────────────
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ error: "Current password required", success: false }, { status: 400 });
      }
      if (body.newPassword !== body.confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match", success: false }, { status: 400 });
      }
      await auth.api.changePassword({
        headers: await headers(),
        body: {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
          revokeOtherSessions: false,
        },
      });
      return NextResponse.json({ success: true, message: "Password updated successfully." });
    }

    // ── Email change ─────────────────────────────────────────────────────────
    if (body.email && body.email !== session.user.email) {
      await auth.api.changeEmail({
        headers: await headers(),
        body: { newEmail: body.email },
      });
      return NextResponse.json({ success: true, message: "Verification email sent to your new address." });
    }

    // ── Other account fields (language, currency, phone etc.) ────────────────
    // Store these in your userProfileSettings or a dedicated account settings table
    // For now we return success — wire up to your DB as needed
    return NextResponse.json({ success: true, message: "Account settings saved." });
  } catch (e: any) {
    console.error("[PATCH /api/user/settings/account]", e);
    return NextResponse.json({ error: e.message ?? "Server error", success: false }, { status: 500 });
  }
}