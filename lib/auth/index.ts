// lib/auth/index.ts
// BetterAuth server instance with cookie helpers for middleware

import { betterAuth }     from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin }          from "better-auth/plugins";
import { nextCookies }    from "better-auth/next-js";
import { db }             from "@/db";
import * as schema        from "@/db/schema";
import { ac, adminRole, agencyRole, creatorRole, userRole } from "./permissions";

export const auth = betterAuth({
  secret:  process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",

  // ── Drizzle + Neon adapter ────────────────────────────────────────────────
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user:         schema.user,
      session:      schema.session,
      account:      schema.account,
      verification: schema.verification,
    },
  }),

  // ── Email + Password auth ─────────────────────────────────────────────────
  emailAndPassword: {
    enabled:                  true,
    requireEmailVerification: false,
    minPasswordLength:        8,
    maxPasswordLength:        128,
  },

  // ── Session config ─────────────────────────────────────────────────────────
  session: {
    expiresIn:    60 * 60 * 24 * 30,
    updateAge:    60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge:  5 * 60,
    },
  },

  // ── User config ────────────────────────────────────────────────────────────
  user: {
    additionalFields: {
      role:   { type: "string", defaultValue: "user", input: false },
      banned: { type: "boolean", defaultValue: false, input: false },
    },
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: [
    admin({
      ac,
      roles: {
        admin:   adminRole,
        agency:  agencyRole,
        creator: creatorRole,
        user:    userRole,
      },
      adminRoles:  ["admin"],
      defaultRole: "user",
    }),
    // ✅ Correct usage: no arguments
    nextCookies(),
  ],

  // ── Trusted origins ────────────────────────────────────────────────────────
  trustedOrigins: [
    process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
  ],
});

export type Session     = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];