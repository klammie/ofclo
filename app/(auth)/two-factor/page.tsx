"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { AuthShell, AuthButton, AuthLink, AlertBox, OTPInput } from "@/components/auth/AuthUi";

export default function TwoFactorPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/dashboard";

  const [code, setCode]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [resent, setResent]       = useState(false);
  const [method, setMethod]       = useState<"otp" | "totp">("otp"); // otp = email, totp = authenticator app
  const [countdown, setCountdown] = useState(0);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleVerify() {
    if (code.length < 6) return;
    setLoading(true);
    setError("");

    try {
      if (method === "otp") {
        await authClient.twoFactor.verifyOtp({ code });
      } else {
        await authClient.twoFactor.verifyTotp({ code });
      }
      router.push(callbackUrl);
    } catch (e: any) {
      setError("Invalid code. Please check and try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setResending(true);
    setError("");
    try {
      await authClient.twoFactor.sendOtp();
      setResent(true);
      setCountdown(60);
      setTimeout(() => setResent(false), 4000);
    } catch (e: any) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code]);

  return (
    <AuthShell
      title="Two-factor verification"
      subtitle={
        method === "otp"
          ? "Enter the 6-digit code we emailed you."
          : "Enter the 6-digit code from your authenticator app."
      }
    >
      <div className="flex flex-col gap-5">
        {/* Method toggle */}
        <div className="flex gap-2">
          {(["otp", "totp"] as const).map((m) => (
            <button key={m} onClick={() => { setMethod(m); setCode(""); setError(""); }}
              className="flex-1 py-2 rounded-xl text-[11px] font-black border transition-all"
              style={method === m
                ? { background: "rgba(124,58,237,0.15)", borderColor: "#7c3aed", color: "#f0eaff" }
                : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(124,58,237,0.18)", color: "rgba(240,234,255,0.5)" }
              }>
              {m === "otp" ? "📧 Email Code" : "📱 Authenticator App"}
            </button>
          ))}
        </div>

        {error && <AlertBox type="error">{error}</AlertBox>}
        {resent && <AlertBox type="success">New code sent! Check your email.</AlertBox>}

        {/* OTP digit input */}
        <OTPInput value={code} onChange={setCode} length={6} />

        <AuthButton onClick={handleVerify} loading={loading} disabled={code.length < 6}>
          Verify Code
        </AuthButton>

        {/* Resend (email OTP only) */}
        {method === "otp" && (
          <div className="text-center">
            <button onClick={handleResend} disabled={resending || countdown > 0}
              className="text-[12px] font-bold transition-colors"
              style={{ color: countdown > 0 ? "rgba(240,234,255,0.3)" : "#7c3aed", background: "none", border: "none", cursor: countdown > 0 ? "not-allowed" : "pointer" }}>
              {resending ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
        )}

        {method === "totp" && (
          <p className="text-center text-[11px]" style={{ color: "rgba(240,234,255,0.4)" }}>
            Open your authenticator app (Google Authenticator, Authy, etc.) to get your code.
          </p>
        )}

        <p className="text-center text-[12px]" style={{ color: "rgba(240,234,255,0.4)" }}>
          Having trouble?{" "}
          <AuthLink href="/login">Sign in again</AuthLink>
        </p>
      </div>
    </AuthShell>
  );
}