import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { headers } from "next/headers";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // ✅ Enable email/password login
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set true if you want verification
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  pages: {
    signIn: "/login",
    signUp: "/register"
  },

  // ✅ Configure Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});

export const getSession = async () =>
  auth.api.getSession({
    headers: await headers(),
  });