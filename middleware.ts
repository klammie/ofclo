// middleware.ts
// Edge runtime middleware for route protection and authentication
// Runs on every request before reaching the route handler

import { NextRequest, NextResponse } from "next/server";
import { betterAuth } from "better-auth";

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Public routes - accessible without authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/webhooks",
];

/**
 * Role-specific route prefixes
 * Format: { route_prefix: [allowed_roles] }
 */
const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/admin":   ["admin"],
  "/dashboard/agency":  ["agency", "admin"],
  "/dashboard/creator": ["creator", "admin"],
  "/dashboard/user":    ["user", "creator", "agency", "admin"],
  
  "/api/admin":         ["admin"],
  "/api/agency":        ["agency", "admin"],
  "/api/creator":       ["creator", "admin"],
  "/api/upload":        ["creator", "admin"], // Only creators can upload media
};

/**
 * Routes that require authentication but no specific role
 */
const AUTH_REQUIRED_ROUTES = [
  "/dashboard",
  "/api/checkout",
  "/api/subscriptions",
  "/api/posts",
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a path matches any pattern in an array
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname.startsWith(route));
}

/**
 * Get allowed roles for a given pathname
 * Returns null if route doesn't have role restrictions
 */
function getAllowedRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return matchesRoute(pathname, PUBLIC_ROUTES);
}

/**
 * Check if route requires authentication
 */
function requiresAuth(pathname: string): boolean {
  return matchesRoute(pathname, AUTH_REQUIRED_ROUTES) || getAllowedRoles(pathname) !== null;
}

/**
 * Extract session from BetterAuth cookie
 * This is a lightweight check - full validation happens in route guards
 */
function getSessionFromCookie(req: NextRequest): { userId: string; role: string } | null {
  const sessionCookie = req.cookies.get("better-auth.session_token");
  
  if (!sessionCookie) {
    return null;
  }

  // For BetterAuth, we can't decode the session token in middleware
  // (it's encrypted). We rely on the presence of the cookie.
  // Full session validation happens in route handlers via auth.api.getSession()
  
  // However, we can read a separate role cookie if we set one during login
  const roleCookie = req.cookies.get("better-auth.user_role");
  const userIdCookie = req.cookies.get("better-auth.user_id");
  
  if (roleCookie && userIdCookie) {
    return {
      userId: userIdCookie.value,
      role: roleCookie.value,
    };
  }
  
  // If role cookie not present, assume authenticated but role unknown
  // Route handler will do full validation
  return { userId: "unknown", role: "unknown" };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Skip middleware for static files and Next.js internals ─────────────────
  if (
    pathname.includes("/_next/") ||
    pathname.includes("/api/_next") ||
    pathname.includes("/__nextjs") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // ─── Allow public routes ─────────────────────────────────────────────────────
  if (isPublicRoute(pathname)) {
    // If user is already logged in and tries to access login/register
    // Redirect them to dashboard
    const session = getSessionFromCookie(request);
    if (session && (pathname === "/login" || pathname === "/register")) {
      const role = session.role;
      const dashboardPath = role && role !== "unknown" 
        ? `/dashboard/${role}`
        : "/dashboard/user";
      
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    
    return NextResponse.next();
  }

  // ─── Check authentication ────────────────────────────────────────────────────
  const session = getSessionFromCookie(request);

  if (!session) {
    // Not authenticated - redirect to login
    if (requiresAuth(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ─── Check role-based access ─────────────────────────────────────────────────
  const allowedRoles = getAllowedRoles(pathname);
  
  if (allowedRoles) {
    const userRole = session.role;
    
    // If role is unknown (cookie not set), let it pass
    // The route handler will do proper validation
    if (userRole === "unknown") {
      return NextResponse.next();
    }
    
    // Check if user's role is allowed for this route
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      const dashboardPath = `/dashboard/${userRole}`;
      
      // If already on a dashboard route, show unauthorized page
      if (pathname.startsWith("/dashboard/")) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
      
      // Otherwise redirect to their dashboard
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  // ─── Security headers ────────────────────────────────────────────────────────
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  
  // CSP for production (adjust as needed)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://telegram.org https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://*.blob.core.windows.net https:",
        "media-src 'self' blob: https://*.blob.core.windows.net",
        "connect-src 'self' https://api.maxelpay.com https://*.blob.core.windows.net",
        "font-src 'self' data:",
        "frame-src 'self' https://www.maxelpay.com",
      ].join("; ")
    );
  }

  return response;
}

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (BetterAuth handles its own routes)
     * 2. /_next/* (Next.js internals)
     * 3. /_static/* (inside /public)
     * 4. /_vercel/* (Vercel internals)
     * 5. Static files (extensions: ico, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};