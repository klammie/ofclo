"use client";

import React, { useState, useCallback } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────

const P      = "#ef3976";
const V      = "#7c3aed";
const GRAD   = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BG     = "#0d0d1a";
const BORDER = "rgba(124,58,237,0.22)";

export function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ══════════════════════════════════════════════════════════════════════════════
// PASSWORD VALIDATION HOOK
// ══════════════════════════════════════════════════════════════════════════════

export interface PasswordRule {
  id:      string;
  label:   string;
  test:    (pw: string) => boolean;
}

const RULES: PasswordRule[] = [
  { id: "length",    label: "At least 8 characters",  test: (pw) => pw.length >= 8          },
  { id: "uppercase", label: "One uppercase letter",   test: (pw) => /[A-Z]/.test(pw)        },
  { id: "lowercase", label: "One lowercase letter",   test: (pw) => /[a-z]/.test(pw)        },
  { id: "number",    label: "One number",             test: (pw) => /\d/.test(pw)           },
  { id: "special",   label: "One special character",  test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export interface PasswordValidationResult {
  score:      number;            // 0–5
  label:      "Weak" | "Fair" | "Good" | "Strong" | "Very Strong" | "";
  color:      string;
  passed:     PasswordRule[];
  failed:     PasswordRule[];
  isValid:    boolean;           // true when score >= 3
  isStrong:   boolean;           // true when score === 5
}

export function usePasswordValidation(password: string): PasswordValidationResult {
  const passed = RULES.filter((r) => r.test(password));
  const failed = RULES.filter((r) => !r.test(password));
  const score  = passed.length;

  const label =
    !password  ? ""            :
    score <= 1 ? "Weak"        :
    score === 2 ? "Fair"       :
    score === 3 ? "Good"       :
    score === 4 ? "Strong"     :
                  "Very Strong";

  const color =
    score <= 1 ? P             :
    score === 2 ? "#fb923c"    :
    score === 3 ? "#fbbf24"    :
    score === 4 ? "#4ade80"    :
                  "#22c55e";

  return { score, label, color, passed, failed, isValid: score >= 3, isStrong: score === 5 };
}

// ══════════════════════════════════════════════════════════════════════════════
// PASSWORD INPUT — show/hide toggle + strength meter + rule checklist
// ══════════════════════════════════════════════════════════════════════════════

interface PasswordInputProps {
  label?:         string;
  value:          string;
  onChange:       (v: string) => void;
  placeholder?:   string;
  error?:         string;
  required?:      boolean;
  disabled?:      boolean;
  // Whether to show the strength meter and rule checklist below the input
  showStrength?:  boolean;
  // Whether to show the compact rule checklist (used on signup/reset)
  showRules?:     boolean;
  // Confirm mode: just show/hide toggle, no strength UI
  isConfirm?:     boolean;
  // When isConfirm=true, the original password to compare against
  matchValue?:    string;
}

export function PasswordInput({
  label       = "Password",
  value,
  onChange,
  placeholder = "Enter your password",
  error,
  required,
  disabled,
  showStrength = false,
  showRules    = false,
  isConfirm    = false,
  matchValue,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const validation = usePasswordValidation(value);

  // Confirm field: check if passwords match
  const confirmError =
    isConfirm && matchValue !== undefined && value.length > 0 && value !== matchValue
      ? "Passwords do not match"
      : undefined;

  const displayError = error ?? confirmError;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label className="text-[10px] font-black uppercase tracking-widest"
        style={{ color: "rgba(240,234,255,0.45)" }}>
        {label}{required && <span style={{ color: P }}> *</span>}
      </label>

      {/* Input row */}
      <div className="relative">
        {/* Lock icon */}
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none"
          style={{ color: "rgba(240,234,255,0.3)" }}>
          🔒
        </span>

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={isConfirm ? "new-password" : "current-password"}
          className="w-full rounded-xl border px-3.5 py-3 text-[13px] outline-none transition-all"
          style={{
            paddingLeft:  "2.75rem",
            paddingRight: "3rem",
            background:   "rgba(255,255,255,0.04)",
            borderColor:  displayError
              ? "rgba(239,57,118,0.5)"
              : (!isConfirm && showStrength && value)
              ? validation.color + "60"
              : BORDER,
            color:       "#f0eaff",
            fontFamily:  "inherit",
            opacity:     disabled ? 0.6 : 1,
            transition:  "border-color 0.2s",
          }}
        />

        {/* Show / Hide toggle button */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg transition-all"
          style={{
            color:      "rgba(240,234,255,0.45)",
            background: "none",
            border:     "none",
            cursor:     disabled ? "not-allowed" : "pointer",
            padding:    "4px",
          }}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            // Eye-off icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            // Eye icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Error */}
      {displayError && (
        <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: P }}>
          <span>⚠</span> {displayError}
        </p>
      )}

      {/* ── Strength meter (shown when showStrength=true and not confirm) ── */}
      {showStrength && !isConfirm && value && (
        <div className="flex flex-col gap-2 mt-0.5">
          {/* Bar row */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: i <= validation.score
                      ? validation.color
                      : "rgba(124,58,237,0.15)",
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-black w-16 text-right transition-colors"
              style={{ color: validation.color }}>
              {validation.label}
            </span>
          </div>

          {/* Rule checklist */}
          {showRules && (
            <div className="grid grid-cols-1 gap-1">
              {RULES.map((rule) => {
                const ok = rule.test(value);
                return (
                  <div key={rule.id} className="flex items-center gap-1.5">
                    <span
                      className="size-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-all duration-200"
                      style={{
                        background: ok ? validation.color + "20" : "rgba(124,58,237,0.08)",
                        color:      ok ? validation.color : "rgba(240,234,255,0.25)",
                        border:     `1px solid ${ok ? validation.color + "40" : "rgba(124,58,237,0.12)"}`,
                      }}
                    >
                      {ok ? "✓" : "○"}
                    </span>
                    <span
                      className="text-[10px] transition-colors duration-200"
                      style={{ color: ok ? "rgba(240,234,255,0.65)" : "rgba(240,234,255,0.3)" }}
                    >
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm match indicator */}
      {isConfirm && value && !confirmError && (
        <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: "#4ade80" }}>
          <span>✓</span> Passwords match
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REST OF AuthUI — unchanged
// ══════════════════════════════════════════════════════════════════════════════

export function AuthShell({ children, title, subtitle }: {
  children: React.ReactNode; title: React.ReactNode; subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{ background: BG, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${V}, transparent 70%)` }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${P}, transparent 70%)` }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <a href="/" className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: GRAD }}>F</div>
            <span className="text-[20px] font-black text-[#f0eaff]">Fanzluv</span>
          </a>
        </div>

        <div className="rounded-[24px] border overflow-hidden"
          style={{ background: CARD, borderColor: BORDER, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)` }}>
          <div className="h-1" style={{ background: GRAD }} />
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-[22px] font-black text-[#f0eaff] leading-tight">{title}</h1>
              {subtitle && <p className="text-[13px] mt-1.5" style={{ color: "rgba(240,234,255,0.5)" }}>{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthInput({ label, type = "text", value, onChange, placeholder, error, hint, disabled, required, icon }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; hint?: string; disabled?: boolean; required?: boolean; icon?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.45)" }}>
        {label}{required && <span style={{ color: P }}> *</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px]"
            style={{ color: "rgba(240,234,255,0.3)" }}>{icon}</span>
        )}
        <input
          type={type} value={value} placeholder={placeholder} disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border px-3.5 py-3 text-[13px] outline-none transition-all"
          style={{
            paddingLeft: icon ? "2.75rem" : undefined,
            background: "rgba(255,255,255,0.04)",
            borderColor: error ? "rgba(239,57,118,0.5)" : BORDER,
            color: "#f0eaff",
            fontFamily: "inherit",
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>
      {error && <p className="text-[11px] font-bold" style={{ color: P }}>{error}</p>}
      {hint && !error && <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.35)" }}>{hint}</p>}
    </div>
  );
}

export function AuthButton({ children, onClick, disabled, loading, variant = "primary", type = "button" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  loading?: boolean; variant?: "primary" | "ghost"; type?: "button" | "submit";
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className="w-full py-3 rounded-xl text-[13px] font-black transition-all flex items-center justify-center gap-2"
      style={variant === "primary"
        ? { background: GRAD, color: "#fff", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", opacity: disabled || loading ? 0.65 : 1 }
        : { background: "rgba(124,58,237,0.08)", border: `1px solid ${BORDER}`, color: "rgba(240,234,255,0.7)", opacity: disabled || loading ? 0.65 : 1 }
      }>
      {loading && (
        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

export function AuthDivider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: BORDER }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.3)" }}>{text}</span>
      <div className="flex-1 h-px" style={{ background: BORDER }} />
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="font-bold transition-colors"
      style={{ color: V, textDecoration: "none" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = P)}
      onMouseLeave={(e) => (e.currentTarget.style.color = V)}>
      {children}
    </a>
  );
}

export function AlertBox({ type, children }: { type: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error:   { bg: "rgba(239,57,118,0.08)", border: "rgba(239,57,118,0.3)", color: P,         icon: "⚠️" },
    success: { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.3)",  color: "#4ade80", icon: "✅" },
    info:    { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.3)", color: V,         icon: "ℹ️" },
  };
  const s = styles[type];
  return (
    <div className="flex items-start gap-2.5 rounded-xl border px-4 py-3"
      style={{ background: s.bg, borderColor: s.border }}>
      <span className="text-[14px] flex-shrink-0 mt-0.5">{s.icon}</span>
      <p className="text-[12px] font-semibold leading-snug" style={{ color: s.color }}>{children}</p>
    </div>
  );
}

export function OTPInput({ value, onChange, length = 6 }: {
  value: string; onChange: (v: string) => void; length?: number;
}) {
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <input ref={inputRef} type="tel" inputMode="numeric" maxLength={length}
        value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        className="sr-only absolute" />
      <div className="flex justify-center gap-2.5" onClick={() => inputRef.current?.focus()}>
        {digits.map((d, i) => (
          <div key={i}
            className="size-12 rounded-xl border flex items-center justify-center text-[20px] font-black cursor-text transition-all"
            style={{
              background: d ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
              borderColor: d ? V : BORDER,
              color: "#f0eaff",
              boxShadow: i === value.length ? `0 0 0 2px ${V}` : "none",
            }}>
            {d || (i === value.length ? <span style={{ color: V, animation: "blink 1s infinite" }}>|</span> : "")}
          </div>
        ))}
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}