// lib/auth/guard.ts
// Server-only helpers for protecting pages and API routes.
// Drop-in replacement for the old NextAuth requireRole().

import { headers }   from "next/headers";
import { redirect }  from "next/navigation";
import { auth }      from "./index";
import type { SessionUser } from "./index";

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

export async function requireRole(
  ...roles: Array<"admin" | "agency" | "creator" | "user">
) {
  const data = await requireAuth();
  if (!roles.includes(data.user.role as typeof roles[number])) {
    redirect("/unauthorized");
  }
  return data;
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

export async function assertRole(
  req: Request,
  ...roles: Role[]
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

  if (!roles.includes(session.user.role as Role)) {
    return {
      session: null,
      error: new Response(
        JSON.stringify({ error: "Forbidden — insufficient role" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
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