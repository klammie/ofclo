"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import {
  AuthShell, AuthButton, AuthLink, AlertBox,
  PasswordInput, usePasswordValidation,
} from "@/components/auth/AuthUi";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  const validation = usePasswordValidation(password);

  useEffect(() => {
    if (!token) setError("Invalid or expired reset link. Please request a new one.");
  }, [token]);

  async function handleReset() {
    setError("");
    if (!validation.isValid) {
      setError("Please choose a stronger password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authClient.resetPassword({ newPassword: password, token });
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: any) {
      setError(e.message ?? "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Password reset! ✅">
        <AlertBox type="success">
          Your password has been updated. Redirecting you to sign in…
        </AlertBox>
        <div className="mt-5 text-center">
          <AuthLink href="/login">Sign in now →</AuthLink>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password to protect your account."
    >
      <div className="flex flex-col gap-5">
        {error && <AlertBox type="error">{error}</AlertBox>}

        {token ? (
          <>
            {/* New password with strength meter + rule checklist */}
            <PasswordInput
              label="New Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              required
              showStrength
              showRules
            />

            {/* Confirm password with match validation */}
            <PasswordInput
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat your new password"
              required
              isConfirm
              matchValue={password}
            />

            <AuthButton
              onClick={handleReset}
              loading={loading}
              disabled={!password || !confirm || !token || !validation.isValid}
            >
              Reset Password
            </AuthButton>
          </>
        ) : (
          <AuthButton variant="ghost" onClick={() => router.push("/forgot-password")}>
            Request New Reset Link
          </AuthButton>
        )}

        <p className="text-center text-[12px]" style={{ color: "rgba(240,234,255,0.4)" }}>
          <AuthLink href="/login">← Back to sign in</AuthLink>
        </p>
      </div>
    </AuthShell>
  );
}