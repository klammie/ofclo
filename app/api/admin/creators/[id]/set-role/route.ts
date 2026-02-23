// app/api/admin/creators/[id]/set-role/route.ts
// Uses BetterAuth's admin plugin to change a user's role
// instead of raw DB updates — enforces permission checks automatically.

import { NextResponse }   from "next/server";
import { assertRole }     from "@/lib/auth/guard";
import { auth }           from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await assertRole(req, "admin");
  if (error) return error;

  const { role } = await req.json() as {
    role: "admin" | "agency" | "creator" | "user";
  };

  if (!["admin", "agency", "creator", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Use BetterAuth's admin plugin API to set the role.
  // This updates the `role` field on the `user` table and
  // invalidates any existing sessions for that user.
  await auth.api.setRole({
    body: {
      userId: params.id,
      role,
    },
    // Pass the current admin's headers so BetterAuth can authorize the action
    headers: req.headers,
  });

  return NextResponse.json({ success: true });
}