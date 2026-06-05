"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import {
  PasswordInput,
  AlertBox,
  usePasswordValidation,
} from "@/components/auth/AuthUi";
import Link from "next/link";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;

export default function SignupPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const validation = usePasswordValidation(password);

  function validate(): string | null {
    if (!name.trim())                        return "Please enter your name.";
    if (!email.trim())                       return "Please enter your email address.";
    if (!/\S+@\S+\.\S+/.test(email))         return "Please enter a valid email address.";
    if (!validation.isValid)                 return "Please choose a stronger password (at least 3 requirements).";
    if (password !== confirm)                return "Passwords do not match.";
    return null;
  }

  async function handleSignup() {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      await authClient.signUp.email({ name, email, password, callbackURL: "/dashboard" });
      router.push("/verify-email?sent=true");
    } catch (e: any) {
      setError(e.message ?? "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  const canSubmit = !!name && !!email && !!password && !!confirm;

  return (
    <div className="min-h-screen flex" style={{ background: "#0d0d1a", fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Left panel — branding (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #1a0d2e 0%, #0d0d1a 60%)" }} />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${V}, transparent 70%)` }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${P}, transparent 70%)` }} />
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
        {/* Perks */}
        <div className="relative z-10">
          <h2 className="text-[40px] font-black text-white leading-[1.15] mb-6">
            Your creator<br />
            <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              journey starts here
            </span>
          </h2>

          <div className="flex flex-col gap-4">
            {[
              { icon: "🎟️", title: "Fan Pass", desc: "Earn XP and unlock exclusive rewards every season" },
              { icon: "🛍️", title: "Fan Shop", desc: "Spend coins on badges, boosts, gifts and more" },
              { icon: "💬", title: "Direct Messages", desc: "Talk directly with your favourite creators" },
              { icon: "🔍", title: "Discover", desc: "Find creators you love across every category" },
            ].map((perk) => (
              <div key={perk.title} className="flex items-start gap-3">
                <div className="size-9 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0"
                  style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  {perk.icon}
                </div>
                <div>
                  <p className="text-[13px] font-black text-white">{perk.title}</p>
                  <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.45)" }}>{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10">
          <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.3)" }}>
            Free to join. No credit card required.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-start justify-center px-5 py-10 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="size-9 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: GRAD }}>F</div>
            <span className="text-[20px] font-black text-white">Fanzluv</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[28px] font-black text-white leading-tight">Create your account</h1>
            <p className="text-[13px] mt-1.5" style={{ color: "rgba(240,234,255,0.45)" }}>
              Join Fanzluv and start connecting with creators
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 text-[13px] font-bold transition-all hover:opacity-90 mb-5"
            style={{
              background: "rgba(255,255,255,0.06)",
              border:     "1px solid rgba(255,255,255,0.12)",
              color:      "rgba(240,234,255,0.85)",
              opacity:    googleLoading ? 0.6 : 1,
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
            Sign up with Google
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

          {/* Form fields */}
          <div className="flex flex-col gap-4">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
                Full Name <span style={{ color: P }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border px-4 py-3.5 text-[13px] outline-none transition-all"
                style={{
                  background:  "rgba(255,255,255,0.04)",
                  borderColor: "rgba(124,58,237,0.22)",
                  color:       "#f0eaff",
                  fontFamily:  "inherit",
                }}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
                Email Address <span style={{ color: P }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border px-4 py-3.5 text-[13px] outline-none transition-all"
                style={{
                  background:  "rgba(255,255,255,0.04)",
                  borderColor: "rgba(124,58,237,0.22)",
                  color:       "#f0eaff",
                  fontFamily:  "inherit",
                }}
              />
            </div>

            {/* Password with strength + rules */}
            <PasswordInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              required
              showStrength
              showRules
            />

            {/* Confirm password */}
            <PasswordInput
              label="Confirm Password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat your password"
              required
              isConfirm
              matchValue={password}
            />

            {/* Submit */}
            <button
              onClick={handleSignup}
              disabled={loading || !canSubmit}
              className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white transition-all flex items-center justify-center gap-2 mt-1"
              style={{
                background: loading || !canSubmit ? "rgba(124,58,237,0.3)" : GRAD,
                boxShadow:  loading || !canSubmit ? "none" : "0 8px 32px rgba(124,58,237,0.4)",
                opacity:    loading ? 0.7 : 1,
                cursor:     loading || !canSubmit ? "not-allowed" : "pointer",
              }}
            >
              {loading && (
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </div>

          {/* Terms note */}
          <p className="text-[11px] text-center mt-4" style={{ color: "rgba(240,234,255,0.3)" }}>
            By signing up you agree to our{" "}
            <a href="/terms" className="underline hover:opacity-80" style={{ color: "rgba(240,234,255,0.5)" }}>Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:opacity-80" style={{ color: "rgba(240,234,255,0.5)" }}>Privacy Policy</a>
          </p>

          {/* Sign in link */}
          <p className="text-center text-[13px] mt-5" style={{ color: "rgba(240,234,255,0.4)" }}>
            Already have an account?{" "}
            <a href="/login" className="font-black transition-colors hover:opacity-80" style={{ color: V }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}