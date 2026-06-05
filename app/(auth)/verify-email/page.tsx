"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { AuthShell, AuthButton, AuthLink, AlertBox } from "@/components/auth/AuthUi";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setError("No verification token found."); return; }

    authClient.verifyEmail({ query: { token } })
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 3000);
      })
      .catch((e: any) => {
        setStatus("error");
        setError(e.message ?? "Verification failed. The link may have expired.");
      });
  }, [token]);

  return (
    <AuthShell
      title={status === "verifying" ? "Verifying your email…" : status === "success" ? "Email verified! ✅" : "Verification failed"}
    >
      <div className="flex flex-col gap-5">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <svg className="animate-spin size-10" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#7c3aed" strokeWidth="3"/>
              <path className="opacity-75" fill="#ef3976" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <p className="text-[13px]" style={{ color: "rgba(240,234,255,0.5)" }}>
              Verifying your email address…
            </p>
          </div>
        )}

        {status === "success" && (
          <>
            <AlertBox type="success">
              Your email has been verified. You&apos;re being redirected to your dashboard…
            </AlertBox>
            <AuthButton onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </AuthButton>
          </>
        )}

        {status === "error" && (
          <>
            <AlertBox type="error">{error}</AlertBox>
            <AuthButton onClick={() => authClient.sendVerificationEmail({ email: "" }).catch(() => null)} variant="ghost">
              Resend Verification Email
            </AuthButton>
            <p className="text-center text-[12px]" style={{ color: "rgba(240,234,255,0.4)" }}>
              <AuthLink href="/login">Back to sign in</AuthLink>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
}