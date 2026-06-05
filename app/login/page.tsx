"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { PasswordInput, AlertBox } from "@/components/auth/AuthUi";
import Link from "next/link";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.email({ email, password, callbackURL: "/dashboard" });
      if ((result as any)?.twoFactorRedirect) {
        router.push("/two-factor");
      } else {
        router.push("/dashboard");
      }
    } catch (e: any) {
      setError(e.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0d0d1a", fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Left panel — branding (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #1a0d2e 0%, #0d0d1a 60%)" }} />
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${V}, transparent 70%)` }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${P}, transparent 70%)` }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Logo */}
        <Link href="/">
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center font-black text-white text-lg"
            style={{ background: GRAD }}>F</div>
          <span className="text-[22px] font-black text-white">Fanzluv</span>
        </div>
        </Link>

        {/* Centre copy */}
        <div className="relative z-10">
          <h2 className="text-[42px] font-black text-white leading-[1.15] mb-4">
            Connect with<br />
            <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              creators you love
            </span>
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "rgba(240,234,255,0.5)" }}>
            Subscribe, tip, unlock exclusive content<br />and earn rewards on every interaction.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[["50k+", "Creators"], ["2M+", "Fans"], ["$10M+", "Paid Out"]].map(([num, label]) => (
              <div key={label}>
                <p className="text-[22px] font-black text-white">{num}</p>
                <p className="text-[11px] font-bold" style={{ color: "rgba(240,234,255,0.4)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10 rounded-2xl border p-5"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(124,58,237,0.2)" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(240,234,255,0.7)" }}>
            &quot;Fanzluv changed how I connect with my fans. The Fan Pass system keeps them coming back every day.&quot;
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="size-8 rounded-full flex items-center justify-center font-black text-white text-[11px]"
              style={{ background: GRAD }}>A</div>
            <div>
              <p className="text-[12px] font-black text-white">@aluna_creates</p>
              <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.4)" }}>142k subscribers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="size-9 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: GRAD }}>F</div>
            <span className="text-[20px] font-black text-white">Fanzluv</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[30px] font-black text-white leading-tight">Welcome back</h1>
            <p className="text-[14px] mt-1.5" style={{ color: "rgba(240,234,255,0.45)" }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 text-[13px] font-bold transition-all hover:opacity-90 mb-5"
            style={{
              background:  "rgba(255,255,255,0.06)",
              border:      "1px solid rgba(255,255,255,0.12)",
              color:       "rgba(240,234,255,0.85)",
              opacity:     googleLoading ? 0.6 : 1,
            }}
          >
            {googleLoading ? (
              <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(124,58,237,0.18)" }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.3)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(124,58,237,0.18)" }} />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4">
              <AlertBox type="error">{error}</AlertBox>
            </div>
          )}

          {/* Email field */}
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
              Email Address <span style={{ color: P }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="you@example.com"
              className="w-full rounded-2xl border px-4 py-3.5 text-[13px] outline-none transition-all"
              style={{
                background:   "rgba(255,255,255,0.04)",
                borderColor:  "rgba(124,58,237,0.22)",
                color:        "#f0eaff",
                fontFamily:   "inherit",
              }}
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5 mb-2">
            <PasswordInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Your password"
              required
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end mb-6">
            <a href="/forgot-password"
              className="text-[12px] font-bold transition-colors hover:opacity-80"
              style={{ color: V }}>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white transition-all flex items-center justify-center gap-2"
            style={{
              background:  loading || !email || !password ? "rgba(124,58,237,0.3)" : GRAD,
              boxShadow:   loading || !email || !password ? "none" : "0 8px 32px rgba(124,58,237,0.4)",
              opacity:     loading ? 0.7 : 1,
              cursor:      loading || !email || !password ? "not-allowed" : "pointer",
            }}
          >
            {loading && (
              <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {loading ? "Signing in…" : "Sign In"}
          </button>

          {/* Sign up link */}
          <p className="text-center text-[13px] mt-6" style={{ color: "rgba(240,234,255,0.4)" }}>
            Don't have an account?{" "}
            <a href="/signup" className="font-black transition-colors hover:opacity-80" style={{ color: V }}>
              Sign up free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}