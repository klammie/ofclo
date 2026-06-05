import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [twoFactorClient()],
});

export const {
  useSession,
  signIn,
  signOut,
  signUp,
  // 2FA helpers
  twoFactor,
} = authClient;