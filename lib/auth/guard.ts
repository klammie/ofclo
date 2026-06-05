// lib/auth/guard.ts
// Server-only helpers for protecting pages and API routes.
// Drop-in replacement for the old NextAuth requireRole().

import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

// ── getSession ────────────────────────────────────────────────────────────────
// Use in Server Components and Route Handlers.
// Returns null if unauthenticated — does NOT redirect.

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;   // { session, user } | null
}

// ── requireAuth ───────────────────────────────────────────────────────────────
// Redirects to /login if no session exists.
// Returns the full { session, user } object.

export async function requireAuth() {
  const data = await getSession();
  if (!data) redirect("/login");
  return data;
}

// ── requireRole ───────────────────────────────────────────────────────────────
// Redirects to /login if no session, /unauthorized if role doesn't match.
// Pass one or more accepted roles.
//
// Usage in Server Components:
//   const { user } = await requireRole("admin");
//   const { user } = await requireRole("admin", "agency");

export async function requireRole(...allowedRoles: Role[]) {
  console.log("[Auth Guard] Checking roles:", allowedRoles);
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.log("[Auth Guard] No session found, redirecting to login");
    redirect("/login");
  }

  console.log("[Auth Guard] Session found:", {
    userId: session.user.id,
    role: session.user.role,
    email: session.user.email,
  });

  // Check for impersonation cookies
  const cookieStore = await cookies();
  const impersonatingUserId = cookieStore.get("impersonating_user_id")?.value;
  const originalUserId = cookieStore.get("original_user_id")?.value;

  let effectiveUser = session.user;
  let isImpersonating = false;

  // If impersonating, get the impersonated user's data
  if (impersonatingUserId && originalUserId) {
    console.log("[Auth Guard] Impersonation detected:", {
      impersonatingUserId,
      originalUserId,
    });

    const [impersonatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, impersonatingUserId))
      .limit(1);

    if (impersonatedUser) {
      effectiveUser = {
        id: impersonatedUser.id,
        name: impersonatedUser.name,
        email: impersonatedUser.email,
        role: impersonatedUser.role,
        emailVerified: impersonatedUser.emailVerified,
        image: impersonatedUser.image,
        createdAt: impersonatedUser.createdAt,
        updatedAt: impersonatedUser.updatedAt,
      };
      isImpersonating = true;
      console.log("[Auth Guard] Using impersonated user:", {
        userId: effectiveUser.id,
        role: effectiveUser.role,
      });
    } else {
      console.log("[Auth Guard] Impersonated user not found, clearing cookies");
      // Clear invalid impersonation cookies
      cookieStore.delete("impersonating_user_id");
      cookieStore.delete("original_user_id");
    }
  }

  console.log("[Auth Guard] Effective user role:", effectiveUser.role);
  console.log("[Auth Guard] Allowed roles:", allowedRoles);

  // Check if user has required role
  if (!allowedRoles.includes(effectiveUser.role as Role)) {
    console.log("[Auth Guard] UNAUTHORIZED - User role not in allowed roles");
    console.log("[Auth Guard] Redirecting to /unauthorized");
    redirect("/unauthorized");
  }

  console.log("[Auth Guard] ✅ Authorization successful");

  return { 
    user: effectiveUser, 
    session,
    isImpersonating,
    originalUserId: isImpersonating ? originalUserId : null,
  };
}

// ── requirePermission ────────────────────────────────────────────────────────
// Checks a specific permission using BetterAuth's admin plugin.
// More granular than requireRole — use when you need action-level checks.
//
// Usage:
//   await requirePermission({ payout: ["initiate"] })
//   await requirePermission({ creator: ["suspend", "ban"] })

export async function requirePermission(
  permission: Record<string, string[]>
) {
  const data = await requireAuth();

  const result = await auth.api.userHasPermission({
    body: {
      userId:     data.user.id,
      permission,
    },
  });

  if (!result.success) {
    redirect("/unauthorized");
  }

  return data;
}

// ── getSessionForApiRoute ─────────────────────────────────────────────────────
// For use inside Route Handlers (app/api/.../route.ts).
// Does NOT redirect — returns null so the handler can return a JSON 401.
//
// Usage:
//   export async function POST(req: NextRequest) {
//     const session = await getSessionForApiRoute(req);
//     if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

export async function getSessionForApiRoute(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return session;
}

// ── assertRole (API route version) ───────────────────────────────────────────
// Same as requireRole but returns { session, error } instead of redirecting.
// Designed for Route Handlers.

type Role = "admin" | "agency" | "creator" | "user";

export async function assertRole(req: Request, ...allowedRoles: Role[]) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return {
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  if (!allowedRoles.includes(session.user.role as Role)) {
    return {
      session: null,
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { session, error: null };
}

// ── assertPermission (API route version) ─────────────────────────────────────

export async function assertPermission(
  req: Request,
  permission: Record<string, string[]>
): Promise<
  | { session: Awaited<ReturnType<typeof auth.api.getSession>>; error: null }
  | { session: null; error: Response }
> {
  const session = await getSessionForApiRoute(req);

  if (!session) {
    return {
      session: null,
      error: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const result = await auth.api.userHasPermission({
    body: { userId: session.user.id, permission },
  });

  if (!result.success) {
    return {
      session: null,
      error: new Response(
        JSON.stringify({ error: "Forbidden — missing permission" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { session, error: null };
}