// lib/auth/client.ts
// Client-side auth instance — safe to import in "use client" components.
// This is what hooks and client-side sign-in/out use.

import { createAuthClient } from "better-auth/react";
import { adminClient }      from "better-auth/client/plugins";
import { ac, adminRole, agencyRole, creatorRole, userRole } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",

  plugins: [
    // adminClient gives access to authClient.admin.* methods
    // and client-side hasPermission checks without DB round-trips
    adminClient({
      ac,
      roles: {
        admin:   adminRole,
        agency:  agencyRole,
        creator: creatorRole,
        user:    userRole,
      },
    }),
  ],
});

// Convenience re-exports so components only import from one place
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient;