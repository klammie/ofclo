// app/api/admin/users/[id]/ban/route.ts
// Uses BetterAuth's built-in ban functionality from the admin plugin

import { NextResponse }  from "next/server";
import { assertRole }    from "@/lib/auth/guard";
import { auth }          from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await assertRole(req, "admin");
  if (error) return error;

  const { reason, expiresIn } = await req.json() as {
    reason?:    string;
    expiresIn?: number;   // seconds until ban expires; omit for permanent
  };

  // BetterAuth admin plugin handles:
  // - Setting banned = true on the user record
  // - Storing ban reason + expiry
  // - Revoking all active sessions for the user immediately
  await auth.api.banUser({
    body: {
      userId:    params.id,
      banReason: reason,
      banExpiresIn: expiresIn,
    },
    headers: req.headers,
  });

  return NextResponse.json({ success: true });
}