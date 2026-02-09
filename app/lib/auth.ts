import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"
import { headers } from "next/headers";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL, 
    database: drizzleAdapter(db, { 
        provider: "pg", // or "pg" or "mysql"
      }), 
      pages: {
        signIn: "/login"
      },
    socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
})

export const getSession = async () =>  auth.api.getSession({
    headers: await headers(),
})

