"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { AuthShell, AuthInput, AuthButton, AuthLink, AlertBox } from "@/components/auth/AuthUi";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit() {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");

    try {
      await authClient.forgetPassword({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email 📬" subtitle="We've sent you a password reset link.">
        <div className="flex flex-col gap-5">
          <AlertBox type="success">
            We sent a reset link to <strong>{email}</strong>. Check your inbox and spam folder.
            The link expires in 1 hour.
          </AlertBox>

          <div className="flex flex-col gap-2">
            <AuthButton variant="ghost" onClick={() => { setSent(false); setEmail(""); }}>
              Try a different email
            </AuthButton>
            <p className="text-center text-[12px]" style={{ color: "rgba(240,234,255,0.4)" }}>
              Back to{" "}
              <AuthLink href="/login">Sign in</AuthLink>
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <div className="flex flex-col gap-5">
        {error && <AlertBox type="error">{error}</AlertBox>}

        <AuthInput
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          icon="✉️"
          required
          onKeyDown={(e: any) => e.key === "Enter" && handleSubmit()}
        />

        <AuthButton onClick={handleSubmit} loading={loading} disabled={!email.trim()}>
          Send Reset Link
        </AuthButton>

        <p className="text-center text-[12px]" style={{ color: "rgba(240,234,255,0.4)" }}>
          Remember your password?{" "}
          <AuthLink href="/login">Sign in</AuthLink>
        </p>
      </div>
    </AuthShell>
  );
}