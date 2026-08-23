"use client";

import { useState, useCallback, useRef } from "react";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
      style={{ color: MUTED }}>
      {children}
      {required && <span style={{ color: P }}>*</span>}
    </label>
  );
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

const inputStyle = {
  background:  "rgba(255,255,255,0.04)",
  borderColor: BORDER,
  color:       TEXT,
  fontFamily:  "inherit",
};

function Input({ value, onChange, placeholder, type = "text", step, min }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; step?: string; min?: string;
}) {
  return (
    <input type={type} value={value} placeholder={placeholder}
      step={step} min={min}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full"
      style={inputStyle} />
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────
function ImageUploader({
  label, value, onChange, aspect, placeholder,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect: "square" | "wide";
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e: any) {
      setUploadError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const isWide = aspect === "wide";

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative overflow-hidden cursor-pointer rounded-xl border transition-all hover:border-[#7c3aed]"
        style={{
          borderColor:  value ? "rgba(124,58,237,0.4)" : BORDER,
          background:   "rgba(255,255,255,0.02)",
          aspectRatio:  isWide ? "3 / 1" : "1 / 1",
          maxHeight:    isWide ? 120 : 96,
        }}
      >
        {value ? (
          <>
            <img src={value} className="w-full h-full object-cover" alt="" />
            {/* Remove button */}
            <button
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 size-6 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
            >✕</button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            {uploading ? (
              <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke={V} strokeWidth="4"/>
                <path className="opacity-75" fill={V} d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(240,234,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-[10px] font-bold" style={{ color: "rgba(240,234,255,0.3)" }}>
                  {placeholder ?? "Click or drag to upload"}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-[10px] font-bold" style={{ color: P }}>{uploadError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Account", icon: "👤" },
  { n: 2, label: "Profile", icon: "🖼️" },
  { n: 3, label: "Pricing", icon: "💰" },
  { n: 4, label: "Review",  icon: "✅" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((s, i) => {
        const done   = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="size-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all"
                style={{
                  background:  done ? "#22c55e" : active ? GRAD : "transparent",
                  borderColor: done ? "#22c55e" : active ? "transparent" : "rgba(124,58,237,0.25)",
                  color:       done || active ? "#fff" : "rgba(240,234,255,0.3)",
                  boxShadow:   active ? "0 0 14px rgba(124,58,237,0.4)" : "none",
                }}>
                {done ? "✓" : s.n}
              </div>
              <p className="text-[8px] font-black uppercase tracking-wider hidden sm:block whitespace-nowrap"
                style={{ color: active ? TEXT : done ? "#4ade80" : "rgba(240,234,255,0.3)" }}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1.5 rounded-full"
                style={{ background: done ? "#22c55e" : "rgba(124,58,237,0.15)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface CreateCreatorModalProps {
  onClose:   () => void;
  onCreated: (creator: any) => void;
}

export function CreateCreatorModal({ onClose, onCreated }: CreateCreatorModalProps) {
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [username,      setUsername]      = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [bio,           setBio]           = useState("");
  const [avatarUrl,     setAvatarUrl]     = useState("");
  const [coverUrl,      setCoverUrl]      = useState("");
  const [location,      setLocation]      = useState("");
  const [website,       setWebsite]       = useState("");
  const [standardPrice, setStandardPrice] = useState("");
  const [vipPrice,      setVipPrice]      = useState("");
  const [sendEmail,     setSendEmail]     = useState(true);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!username) {
      setUsername(
        v.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "_").slice(0, 30)
      );
    }
  };

  const step1Valid = name.trim() && email.trim() && email.includes("@") &&
    (sendEmail || password.length >= 8);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/agency/creators/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:             name.trim(),
          email:            email.trim(),
          username:         username.trim() || undefined,
          password:         !sendEmail ? password : undefined,
          bio:              bio.trim()       || undefined,
          avatarUrl:        avatarUrl.trim() || undefined,
          coverUrl:         coverUrl.trim()  || undefined,
          location:         location.trim()  || undefined,
          website:          website.trim()   || undefined,
          standardPrice:    standardPrice ? Number(standardPrice) : undefined,
          vipPrice:         vipPrice      ? Number(vipPrice)      : undefined,
          sendWelcomeEmail: sendEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create creator");
        setSaving(false);
        return;
      }
      onCreated(data.creator);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setSaving(false);
    }
  }, [name, email, username, password, bio, avatarUrl, coverUrl, location,
      website, standardPrice, vipPrice, sendEmail, onCreated]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-lg rounded-[24px] border overflow-hidden flex flex-col"
        style={{
          background:  CARD,
          borderColor: BORDER,
          boxShadow:   "0 24px 80px rgba(0,0,0,0.6)",
          maxHeight:   "92vh",
          animation:   "popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}>

        <div className="h-1 flex-shrink-0" style={{ background: GRAD }} />

        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: BORDER, background: SURF }}>
          <div>
            <h2 className="text-[15px] font-black" style={{ color: TEXT }}>Create New Creator</h2>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Add a creator directly to your agency roster</p>
          </div>
          <button onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}>✕</button>
        </div>

        <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: BORDER, background: SURF }}>
          <StepBar current={step} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Account Details</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Basic info — the creator uses this to log in</p>
              </div>

              <Field label="Full Name" required>
                <Input value={name} onChange={handleNameChange} placeholder="Jane Smith" />
              </Field>

              <Field label="Email Address" required>
                <Input value={email} onChange={setEmail} placeholder="jane@example.com" type="email" />
              </Field>

              <Field label="Username">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold"
                    style={{ color: MUTED }}>@</span>
                  <input value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="jane_smith" maxLength={30}
                    className="w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-[13px] outline-none"
                    style={inputStyle} />
                </div>
                <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>Auto-generated — change if needed</p>
              </Field>

              {/* Send invite toggle */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                <button onClick={() => setSendEmail(!sendEmail)}
                  className="relative inline-flex items-center h-6 w-11 rounded-full mt-0.5 flex-shrink-0 transition-all"
                  style={{ background: sendEmail ? GRAD : "rgba(124,58,237,0.15)" }}>
                  <span className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: sendEmail ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
                <div>
                  <p className="text-[12px] font-black" style={{ color: TEXT }}>Send invite email</p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                    Sends a password-setup link so the creator can access their account
                  </p>
                </div>
              </div>

              {/* Password field — only when email invite is OFF */}
              {!sendEmail && (
                <Field label="Set Password" required>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full rounded-xl border px-3.5 pr-10 py-2.5 text-[13px] outline-none"
                      style={inputStyle}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: MUTED }}
                    >
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {password && password.length < 8 && (
                    <p className="text-[10px] font-bold" style={{ color: P }}>Password must be at least 8 characters</p>
                  )}
                </Field>
              )}
            </>
          )}

          {/* ── Step 2: Profile ── */}
          {step === 2 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Creator Profile</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>All optional — the creator can update these later</p>
              </div>

              {/* Cover + avatar uploaders */}
              <div className="relative">
                <ImageUploader
                  label="Cover Image"
                  value={coverUrl}
                  onChange={setCoverUrl}
                  aspect="wide"
                  placeholder="Click or drag to upload cover photo"
                />
                {/* Avatar overlaid on cover */}
                <div className="absolute bottom-0 left-4 translate-y-1/2 z-10">
                  <div className="size-14 rounded-full overflow-hidden border-2 flex items-center justify-center font-black text-white text-[18px]"
                    style={{ borderColor: CARD, background: avatarUrl ? "transparent" : GRAD }}>
                    {avatarUrl
                      ? <img src={avatarUrl} className="size-full object-cover" alt="" />
                      : name.charAt(0).toUpperCase() || "?"
                    }
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <ImageUploader
                  label="Profile Picture"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  aspect="square"
                  placeholder="Click or drag to upload avatar"
                />
              </div>

              <Field label="Bio">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell fans about this creator…" rows={3} maxLength={500}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                  style={inputStyle} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Location">
                  <Input value={location} onChange={setLocation} placeholder="New York, NY" />
                </Field>
                <Field label="Website">
                  <Input value={website} onChange={setWebsite} placeholder="https://…" />
                </Field>
              </div>
            </>
          )}

          {/* ── Step 3: Pricing ── */}
          {step === 3 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Subscription Pricing</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Set monthly prices. Leave blank for free.</p>
              </div>

              <Field label="Standard Price ($/month)">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-black" style={{ color: MUTED }}>$</span>
                  <input type="number" value={standardPrice} onChange={(e) => setStandardPrice(e.target.value)}
                    placeholder="9.99" min="0" step="0.01"
                    className="w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-[13px] outline-none"
                    style={inputStyle} />
                </div>
              </Field>

              <Field label="VIP Price ($/month)">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-black" style={{ color: MUTED }}>$</span>
                  <input type="number" value={vipPrice} onChange={(e) => setVipPrice(e.target.value)}
                    placeholder="24.99" min="0" step="0.01"
                    className="w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-[13px] outline-none"
                    style={inputStyle} />
                </div>
              </Field>

              <div className="rounded-[16px] border px-4 py-3"
                style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  💡 VIP subscribers get exclusive content, longer videos, priority DMs and custom requests.
                </p>
              </div>
            </>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Review & Create</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Confirm before creating the account</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-[16px] border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: MUTED }}>Account</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-12 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[16px] flex-shrink-0"
                      style={{ background: avatarUrl ? "transparent" : GRAD }}>
                      {avatarUrl ? <img src={avatarUrl} className="size-full object-cover" alt="" /> : name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-black" style={{ color: TEXT }}>{name}</p>
                      <p className="text-[11px]" style={{ color: MUTED }}>@{username}</p>
                      <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.3)" }}>{email}</p>
                    </div>
                  </div>
                  {bio && <p className="text-[11px]" style={{ color: MUTED }}>{bio}</p>}
                </div>

                <div className="rounded-[16px] border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: MUTED }}>Pricing</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[9px] font-bold uppercase" style={{ color: MUTED }}>Standard</p>
                      <p className="text-[15px] font-black" style={{ color: TEXT }}>
                        {standardPrice ? `$${Number(standardPrice).toFixed(2)}/mo` : "Free"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase" style={{ color: MUTED }}>VIP</p>
                      <p className="text-[15px] font-black" style={{ color: TEXT }}>
                        {vipPrice ? `$${Number(vipPrice).toFixed(2)}/mo` : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[16px] border px-4 py-3 flex items-center gap-3"
                  style={{
                    background:  sendEmail ? "rgba(34,197,94,0.07)" : "rgba(239,57,118,0.06)",
                    borderColor: sendEmail ? "rgba(34,197,94,0.25)" : "rgba(239,57,118,0.2)",
                  }}>
                  <span className="text-[18px]">{sendEmail ? "📧" : "🔑"}</span>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    {sendEmail
                      ? `A password-setup email will be sent to ${email}`
                      : "Password set manually — no email will be sent"}
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border px-4 py-3 flex items-center gap-2"
                  style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
                  <span>⚠️</span>
                  <p className="text-[12px] font-bold flex-1" style={{ color: P }}>{error}</p>
                  <button onClick={() => setError("")} style={{ color: MUTED }}>✕</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: BORDER }}>
          {step === 1 ? (
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all"
              style={{ background: "transparent", borderColor: BORDER, color: MUTED }}>
              Cancel
            </button>
          ) : (
            <button onClick={() => { setError(""); setStep((s) => s - 1); }}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all"
              style={{ background: "transparent", borderColor: BORDER, color: MUTED }}>
              ← Back
            </button>
          )}

          <div className="flex-shrink-0 text-[10px] font-bold" style={{ color: MUTED }}>
            {step} / {STEPS.length}
          </div>

          {step < STEPS.length ? (
            <button
              onClick={() => { setError(""); setStep((s) => s + 1); }}
              disabled={step === 1 && !step1Valid}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black text-white transition-all"
              style={{
                background: step === 1 && !step1Valid ? "rgba(124,58,237,0.2)" : GRAD,
                opacity:    step === 1 && !step1Valid ? 0.6 : 1,
                cursor:     step === 1 && !step1Valid ? "not-allowed" : "pointer",
                boxShadow:  step === 1 && !step1Valid ? "none" : "0 4px 14px rgba(124,58,237,0.3)",
              }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: saving ? "rgba(124,58,237,0.25)" : GRAD,
                boxShadow:  saving ? "none" : "0 4px 14px rgba(124,58,237,0.3)",
                opacity:    saving ? 0.7 : 1,
              }}>
              {saving ? (
                <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>Creating…</>
              ) : "🚀 Create Creator"}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}