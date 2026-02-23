// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth/client"; // better-auth/react

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/dashboard", // redirect on success
    });

    if (error) {
      setError(error.message ?? "Invalid credentials");
      setLoading(false);
      return;
    }

    // Fallback redirect
    router.push("/dashboard");
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);

    const { error } = await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });

    if (error) {
      setError(error.message ?? "Google sign-in failed");
      setLoading(false);
    }
    // On success, BetterAuth handles redirect automatically
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <h1 className="text-white font-black text-2xl">Sign in</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Email/password form */}
      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in…" : "Sign in with Email"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-2 text-white/50 text-xs">
        <span className="flex-1 h-px bg-white/10" />
        OR
        <span className="flex-1 h-px bg-white/10" />
      </div>

      {/* Google OAuth button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
      >
        {loading ? "Redirecting…" : "Sign in with Google"}
      </button>
    </div>
  );
}