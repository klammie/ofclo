// components/auth/RegisterForm.tsx
"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { signUp }    from "@/lib/auth/client";

export function RegisterForm() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<"user" | "creator">("user");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // BetterAuth sign-up — role is set server-side after registration
    // by a Server Action or API route (not passed directly to signUp)
    const { data, error } = await signUp.email({
      name,
      email,
      password,
      callbackURL: "/onboarding",  // redirect after signup
    });

    if (error) {
      setError(error.message ?? "Registration failed");
      setLoading(false);
      return;
    }

    // After signup, call our API to set the chosen role
    // (role can't be passed directly via signUp for security)
    if (role === "creator") {
      await fetch("/api/onboarding/set-creator-role", { method: "POST" });
    }

    router.push("/onboarding");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-white font-black text-2xl">Create account</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Display name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50"
      />
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
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        minLength={8}
        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50"
      />

      {/* Role selector */}
      <div className="flex gap-3">
        {(["user", "creator"] as const).map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
            style={{
              borderColor: role === r ? "#6366f1" : "#2a2a4a",
              background:  role === r ? "#6366f120" : "transparent",
              color:        role === r ? "#6366f1"  : "#666",
            }}
          >
            {r === "user" ? "👤 Fan" : "✨ Creator"}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}