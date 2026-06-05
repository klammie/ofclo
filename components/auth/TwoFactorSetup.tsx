"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { OTPInput, AlertBox, AuthButton } from "@/components/auth/AuthUi";

const V = "#7c3aed";
const P = "#ef3976";
const CARD = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";

// ─── Enable 2FA flow ──────────────────────────────────────────────────────────

export function TwoFactorSetup({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep]           = useState<"choose" | "email-verify" | "totp-setup" | "done">("choose");
  const [method, setMethod]       = useState<"email" | "totp">("email");
  const [totpUri, setTotpUri]     = useState("");
  const [qrCode, setQrCode]       = useState("");
  const [code, setCode]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [password, setPassword]   = useState("");

  async function handleEnableEmail() {
    setLoading(true);
    setError("");
    try {
      // Send OTP to email
      await authClient.twoFactor.sendOtp();
      setStep("email-verify");
    } catch (e: any) {
      setError(e.message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnableTotp() {
    setLoading(true);
    setError("");
    try {
      const result = await authClient.twoFactor.getTotpUri({ password });
      setTotpUri((result as any).totp ?? "");
      // Generate QR code URL using a free service
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent((result as any).totp ?? "")}&size=200x200`);
      setStep("totp-setup");
    } catch (e: any) {
      setError(e.message ?? "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndEnable() {
    if (code.length < 6) return;
    setLoading(true);
    setError("");
    try {
      if (method === "email") {
        await authClient.twoFactor.verifyOtp({ code });
        await authClient.twoFactor.enable({ password });
      } else {
        await authClient.twoFactor.verifyTotp({ code });
      }
      setStep("done");
      onComplete?.();
    } catch (e: any) {
      setError("Invalid code. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <AlertBox type="success">
        Two-factor authentication is now enabled! Your account is more secure.
      </AlertBox>
    );
  }

  if (step === "choose") {
    return (
      <div className="flex flex-col gap-4">
        {error && <AlertBox type="error">{error}</AlertBox>}

        <p className="text-[12px]" style={{ color: "rgba(240,234,255,0.5)" }}>
          Choose how you&apos;d like to receive your verification codes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "email", icon: "📧", title: "Email Code",     desc: "We'll send a 6-digit code to your email" },
            { id: "totp",  icon: "📱", title: "Authenticator",  desc: "Use Google Authenticator, Authy, etc."   },
          ].map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id as "email" | "totp")}
              className="flex flex-col items-start gap-2 rounded-[14px] border p-4 transition-all text-left"
              style={method === m.id
                ? { background: "rgba(124,58,237,0.12)", borderColor: V, boxShadow: `0 0 12px rgba(124,58,237,0.15)` }
                : { background: "rgba(255,255,255,0.02)", borderColor: BORDER }
              }>
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="text-[13px] font-black text-[#f0eaff]">{m.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.4)" }}>{m.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Password field (needed for TOTP setup) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
            Current Password *
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Required to enable 2FA"
            className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: "#f0eaff", fontFamily: "inherit" }} />
        </div>

        <AuthButton
          onClick={method === "email" ? handleEnableEmail : handleEnableTotp}
          loading={loading} disabled={!password}>
          Continue with {method === "email" ? "Email Code" : "Authenticator App"}
        </AuthButton>
      </div>
    );
  }

  if (step === "email-verify") {
    return (
      <div className="flex flex-col gap-4">
        <AlertBox type="info">We&apos;ve sent a 6-digit code to your email. Enter it below to enable 2FA.</AlertBox>
        {error && <AlertBox type="error">{error}</AlertBox>}
        <OTPInput value={code} onChange={setCode} length={6} />
        <AuthButton onClick={handleVerifyAndEnable} loading={loading} disabled={code.length < 6}>
          Verify & Enable 2FA
        </AuthButton>
        <button onClick={() => { setStep("choose"); setCode(""); setError(""); }}
          className="text-[11px] font-bold text-center"
          style={{ color: "rgba(240,234,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
          ← Back
        </button>
      </div>
    );
  }

  if (step === "totp-setup") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[12px]" style={{ color: "rgba(240,234,255,0.55)" }}>
          Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
        </p>

        {/* QR code */}
        {qrCode && (
          <div className="flex justify-center">
            <div className="rounded-[14px] border p-4" style={{ background: "#fff", borderColor: BORDER }}>
              <img src={qrCode} width={160} height={160} alt="2FA QR Code" />
            </div>
          </div>
        )}

        {/* Manual entry */}
        {totpUri && (
          <div className="rounded-xl border p-3" style={{ background: "rgba(124,58,237,0.06)", borderColor: BORDER }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(240,234,255,0.35)" }}>
              Can&apos;t scan? Enter manually:
            </p>
            <p className="text-[11px] font-mono break-all" style={{ color: "#f0eaff" }}>
              {totpUri.match(/secret=([^&]+)/)?.[1] ?? ""}
            </p>
          </div>
        )}

        {error && <AlertBox type="error">{error}</AlertBox>}
        <OTPInput value={code} onChange={setCode} length={6} />
        <AuthButton onClick={handleVerifyAndEnable} loading={loading} disabled={code.length < 6}>
          Verify & Enable 2FA
        </AuthButton>
      </div>
    );
  }

  return null;
}

// ─── Disable 2FA ──────────────────────────────────────────────────────────────

export function TwoFactorDisable({ onComplete }: { onComplete?: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  async function handleDisable() {
    setLoading(true);
    setError("");
    try {
      await authClient.twoFactor.disable({ password });
      setDone(true);
      onComplete?.();
    } catch (e: any) {
      setError("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return <AlertBox type="info">Two-factor authentication has been disabled.</AlertBox>;

  return (
    <div className="flex flex-col gap-4">
      {error && <AlertBox type="error">{error}</AlertBox>}
      <AlertBox type="info">Enter your current password to disable two-factor authentication.</AlertBox>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
          Current Password
        </label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: "#f0eaff", fontFamily: "inherit" }} />
      </div>
      <AuthButton onClick={handleDisable} loading={loading} disabled={!password}
        variant="ghost">
        Disable 2FA
      </AuthButton>
    </div>
  );
}