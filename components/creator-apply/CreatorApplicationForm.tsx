"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useCreatorApply } from "@/lib/hooks/use-creator-apply";
import type {
  IdDocumentType,
  ContentCategory,
  ApplicationStatus,
} from "@/lib/types";
import Link from "next/link";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD = "#1a1635";
const SURF = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT  = "#f0eaff";
const MUTED = "rgba(240,234,255,0.45)";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.45)" }}>{children}</label>;
}

function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>;
}

function Input({ label, value, onChange, type = "text", placeholder = "", required, hint, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; hint?: string; disabled?: boolean;
}) {
  return (
    <FieldGroup>
      <Label>{label}{required && <span style={{ color: P }}> *</span>}</Label>
      <input
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}
      />
      {hint && <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.35)" }}>{hint}</p>}
    </FieldGroup>
  );
}

function Select({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <FieldGroup>
      <Label>{label}{required && <span style={{ color: P }}> *</span>}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
        style={{ background: SURF, borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldGroup>
  );
}

function Textarea({ label, value, onChange, placeholder = "", rows = 4, maxLength, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; maxLength?: number; required?: boolean;
}) {
  return (
    <FieldGroup>
      <div className="flex items-center justify-between">
        <Label>{label}{required && <span style={{ color: P }}> *</span>}</Label>
        {maxLength && <span className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>{value.length}/{maxLength}</span>}
      </div>
      <textarea value={value} placeholder={placeholder} rows={rows} maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
    </FieldGroup>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button onClick={() => onChange(!checked)}
        className="relative inline-flex items-center h-6 w-11 rounded-full shrink-0 mt-0.5 transition-all duration-200"
        style={{ background: checked ? GRAD : "rgba(124,58,237,0.15)", border: `1px solid ${checked ? "transparent" : BORDER}` }}>
        <span className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }} />
      </button>
      <div>
        <p className="text-[13px] font-bold" style={{ color: TEXT }}>{label}</p>
        {description && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{description}</p>}
      </div>
    </div>
  );
}

// ─── Document Upload Zone ─────────────────────────────────────────────────────

function DocumentUpload({ label, description, icon, accept = "image/*", url, onUpload, required, hint }: {
  label: string; description: string; icon: string; accept?: string;
  url: string; onUpload: (file: File) => void; required?: boolean; hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(url || null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { if (url) setPreview(url); }, [url]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onUpload(file);
  }, [onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <FieldGroup>
      <Label>{label}{required && <span style={{ color: P }}> *</span>}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className="relative rounded-[14px] border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden"
        style={{
          borderColor: isDragging ? V : preview ? "rgba(34,197,94,0.4)" : BORDER,
          background:  isDragging ? "rgba(124,58,237,0.08)" : preview ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
          minHeight: 140,
        }}>
        {preview ? (
          <div className="relative">
            <img src={preview} className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🔄</span>
              <p className="text-[11px] font-black text-white">Click to replace</p>
            </div>
            <div className="absolute top-2 right-2 size-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-black">✓</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
            <div className="size-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "rgba(124,58,237,0.1)" }}>{icon}</div>
            <div>
              <p className="text-[12px] font-bold" style={{ color: TEXT }}>{description}</p>
              <p className="text-[10px] mt-1" style={{ color: MUTED }}>Drag & drop or click to browse</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.3)" }}>JPG, PNG or PDF · Max 10MB</p>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {hint && <p className="text-[10px] flex items-start gap-1.5" style={{ color: MUTED }}><span>💡</span>{hint}</p>}
    </FieldGroup>
  );
}

// ─── Step progress bar ────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Personal Info", icon: "👤" },
  { n: 2, label: "Identity",      icon: "🪪" },
  { n: 3, label: "Your Profile",  icon: "✨" },
  { n: 4, label: "Payout Info",   icon: "💰" },
  { n: 5, label: "Agreements",    icon: "✍️" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const done   = current > step.n;
        const active = current === step.n;
        return (
          <div key={step.n} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="size-8 rounded-full flex items-center justify-center text-[12px] font-black transition-all duration-300 border-2"
                style={{
                  background:  done ? "#22c55e" : active ? GRAD : "transparent",
                  borderColor: done ? "#22c55e" : active ? "transparent" : "rgba(124,58,237,0.25)",
                  color:       done || active ? "#fff" : "rgba(240,234,255,0.3)",
                  boxShadow:   active ? `0 0 16px rgba(124,58,237,0.4)` : "none",
                }}>
                {done ? "✓" : step.n}
              </div>
              <p className="text-[9px] font-black uppercase tracking-wider hidden sm:block whitespace-nowrap"
                style={{ color: active ? TEXT : done ? "#4ade80" : "rgba(240,234,255,0.3)" }}>
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
                style={{ background: done ? "#22c55e" : "rgba(124,58,237,0.15)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Validation errors banner ─────────────────────────────────────────────────

function ValidationErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-[14px] border px-4 py-3.5 flex flex-col gap-2"
      style={{ background: "rgba(239,57,118,0.07)", borderColor: "rgba(239,57,118,0.3)" }}>
      <p className="text-[12px] font-black flex items-center gap-2" style={{ color: P }}>
        <span>⚠️</span> Please complete the following before continuing:
      </p>
      <ul className="flex flex-col gap-1 pl-1">
        {errors.map((e) => (
          <li key={e} className="text-[11px] flex items-start gap-1.5" style={{ color: MUTED }}>
            <span style={{ color: P, flexShrink: 0 }}>•</span>{e}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Nav buttons ──────────────────────────────────────────────────────────────

function NavButtons({ step, total, onBack, onNext, onSubmit, isLoading, isLast, canProceed }: {
  step: number; total: number; onBack: () => void; onNext: () => void;
  onSubmit: () => void; isLoading: boolean; isLast: boolean; canProceed: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: BORDER }}>
      <button onClick={onBack} disabled={step === 1 || isLoading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black border transition-all"
        style={{
          background: "rgba(255,255,255,0.03)", borderColor: BORDER,
          color: step === 1 ? "rgba(240,234,255,0.2)" : MUTED,
          cursor: step === 1 ? "not-allowed" : "pointer",
        }}>
        ← Back
      </button>

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold" style={{ color: MUTED }}>
          Step {step} of {total}
        </span>

        {isLast ? (
          <button onClick={onSubmit} disabled={isLoading || !canProceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-black text-white transition-all"
            style={{
              background:  !canProceed ? "rgba(124,58,237,0.2)" : GRAD,
              boxShadow:   canProceed ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
              opacity:     isLoading ? 0.7 : 1,
              cursor:      !canProceed || isLoading ? "not-allowed" : "pointer",
            }}>
            {isLoading ? (
              <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Submitting…</>
            ) : "Submit Application ✨"}
          </button>
        ) : (
          <button onClick={onNext} disabled={isLoading || !canProceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-black text-white transition-all group"
            style={{
              background:  !canProceed ? "rgba(124,58,237,0.2)" : GRAD,
              boxShadow:   canProceed ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
              opacity:     isLoading ? 0.7 : 1,
              cursor:      !canProceed || isLoading ? "not-allowed" : "pointer",
            }}>
            {isLoading ? "Saving…" : (
              <>
                Continue →
                {!canProceed && (
                  <span className="ml-1 text-[10px] opacity-60">(fill required fields)</span>
                )}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Countries list ───────────────────────────────────────────────────────────

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Netherlands", "Spain", "Italy", "Brazil", "Mexico",
  "Japan", "South Korea", "India", "Jamaica", "Trinidad and Tobago",
  "Nigeria", "Ghana", "South Africa", "Other",
].map((c) => ({ value: c, label: c }));

// ─── Per-step validators ──────────────────────────────────────────────────────

type StepErrors = string[];

function validateStep1(d: any): StepErrors {
  const e: StepErrors = [];
  if (!d.legalFirstName?.trim()) e.push("Legal first name is required");
  if (!d.legalLastName?.trim())  e.push("Legal last name is required");
  if (!d.dateOfBirth?.trim())    e.push("Date of birth is required");
  else {
    const age = (Date.now() - new Date(d.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) e.push("You must be 18 or older to become a creator");
  }
  if (!d.country?.trim())    e.push("Country of residence is required");
  if (!d.city?.trim())       e.push("City is required");
  if (!d.postalCode?.trim()) e.push("Postal code is required");
  if (!d.address?.trim())    e.push("Street address is required");
  return e;
}

function validateStep2(d: any): StepErrors {
  const e: StepErrors = [];
  if (!d.documentType)            e.push("Document type is required");
  if (!d.documentNumber?.trim())  e.push("Document number is required");
  if (!d.documentExpiry?.trim())  e.push("Document expiry date is required");
  else if (new Date(d.documentExpiry) < new Date()) e.push("Your document has expired — please use a valid document");
  if (!d.documentFrontUrl)        e.push("Front of document photo is required");
  const needsBack = ["drivers_license", "national_id", "residence_permit"].includes(d.documentType);
  if (needsBack && !d.documentBackUrl) e.push("Back of document photo is required");
  if (!d.selfieWithIdUrl) e.push("Selfie holding your ID is required");
  if (!d.selfieUrl)       e.push("Clear face photo is required");
  return e;
}

function validateStep3(d: any): StepErrors {
  const e: StepErrors = [];
  if (!d.displayName?.trim()) e.push("Display name is required");
  if (!d.username?.trim())    e.push("Username is required");
  else if (!/^[a-zA-Z0-9_]+$/.test(d.username)) e.push("Username can only contain letters, numbers and underscores");
  if (!d.bio?.trim())         e.push("Bio is required");
  const cats = JSON.parse(d.categories || "[]");
  if (cats.length === 0)      e.push("Select at least one content category");
  if (!d.contentDescription?.trim()) e.push("Content description is required");
  return e;
}

function validateStep4(d: any): StepErrors {
  const e: StepErrors = [];
  if (!d.payoutMethod) e.push("Payout method is required");
  if (d.payoutMethod === "bank") {
    if (!d.bankAccountName?.trim())   e.push("Account name is required");
    if (!d.bankName?.trim())          e.push("Bank name is required");
    if (!d.bankAccountNumber?.trim()) e.push("Account number is required");
    if (!d.bankRoutingNumber?.trim()) e.push("Routing / SWIFT code is required");
    if (!d.bankCountry?.trim())       e.push("Bank country is required");
  }
  if (d.payoutMethod === "crypto") {
    if (!d.cryptoCurrency?.trim())      e.push("Cryptocurrency is required");
    if (!d.cryptoWalletAddress?.trim()) e.push("Wallet address is required");
  }
  if (!d.taxCountry?.trim()) e.push("Tax country is required");
  if (!d.taxId?.trim())      e.push("Tax ID is required");
  if (d.isBusinessAccount && !d.businessName?.trim()) e.push("Business name is required");
  return e;
}

function validateStep5(d: any): StepErrors {
  const e: StepErrors = [];
  if (!d.agreedToAge18)          e.push("You must confirm you are 18 or older");
  if (!d.agreedToTerms)          e.push("You must agree to the Terms of Service");
  if (!d.agreedToContentPolicy)  e.push("You must agree to the Content Policy");
  if (!d.agreedToPrivacyPolicy)  e.push("You must agree to the Privacy Policy");
  if (!d.agreedToTaxObligations) e.push("You must acknowledge your tax obligations");
  if (!d.signature?.trim())      e.push("Electronic signature is required");
  return e;
}

const VALIDATORS = [validateStep1, validateStep2, validateStep3, validateStep4, validateStep5];

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

function StepPersonal({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-black" style={{ color: TEXT }}>Personal Information</h2>
        <p className="text-[12px] mt-1" style={{ color: MUTED }}>This information is used for identity verification and will not be shown publicly.</p>
      </div>
      <div className="rounded-[14px] border px-4 py-3 flex items-start gap-2"
        style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
        <span className="text-[16px] flex-shrink-0">🔒</span>
        <p className="text-[11px]" style={{ color: MUTED }}>Your personal details are encrypted and stored securely.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Legal First Name" value={data.legalFirstName ?? ""} onChange={(v) => onChange("legalFirstName", v)} required placeholder="As it appears on your ID" />
        <Input label="Legal Last Name"  value={data.legalLastName  ?? ""} onChange={(v) => onChange("legalLastName",  v)} required placeholder="As it appears on your ID" />
      </div>
      <Input label="Date of Birth" value={data.dateOfBirth ?? ""} onChange={(v) => onChange("dateOfBirth", v)} type="date" required hint="You must be 18 or older to become a creator" />
      <Select label="Country of Residence" value={data.country ?? ""} onChange={(v) => onChange("country", v)} options={COUNTRIES} required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="City"        value={data.city        ?? ""} onChange={(v) => onChange("city",       v)} required />
        <Input label="Postal Code" value={data.postalCode  ?? ""} onChange={(v) => onChange("postalCode", v)} required />
      </div>
      <Input label="Street Address" value={data.address ?? ""} onChange={(v) => onChange("address", v)} required placeholder="Your full street address" />
    </div>
  );
}

// ─── Step 2: Identity Verification ───────────────────────────────────────────

const DOC_TYPES: { value: IdDocumentType; label: string; icon: string; needsBack: boolean }[] = [
  { value: "passport",         label: "Passport",          icon: "📕", needsBack: false },
  { value: "drivers_license",  label: "Driver's Licence",  icon: "🚗", needsBack: true  },
  { value: "national_id",      label: "National ID Card",  icon: "🪪", needsBack: true  },
  { value: "residence_permit", label: "Residence Permit",  icon: "📄", needsBack: true  },
];

function StepIdentity({ data, onChange, onUpload }: {
  data: any; onChange: (k: string, v: any) => void; onUpload: (field: string, file: File) => void;
}) {
  const selectedDocType = DOC_TYPES.find((d) => d.value === data.documentType);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-black" style={{ color: TEXT }}>Identity Verification</h2>
        <p className="text-[12px] mt-1" style={{ color: MUTED }}>We need to verify your identity to keep the platform safe for everyone.</p>
      </div>
      <FieldGroup>
        <Label>Document Type <span style={{ color: P }}>*</span></Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DOC_TYPES.map((doc) => (
            <button key={doc.value} onClick={() => onChange("documentType", doc.value)}
              className="flex flex-col items-center gap-2 rounded-[14px] border p-3 transition-all duration-150"
              style={data.documentType === doc.value
                ? { background: "rgba(124,58,237,0.15)", borderColor: V, boxShadow: `0 0 12px rgba(124,58,237,0.2)` }
                : { background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
              <span className="text-2xl">{doc.icon}</span>
              <span className="text-[10px] font-black text-center" style={{ color: data.documentType === doc.value ? TEXT : MUTED }}>{doc.label}</span>
            </button>
          ))}
        </div>
      </FieldGroup>
      {data.documentType && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Document Number" value={data.documentNumber ?? ""} onChange={(v) => onChange("documentNumber", v)} required placeholder="e.g. A12345678" />
            <Input label="Expiry Date"     value={data.documentExpiry ?? ""} onChange={(v) => onChange("documentExpiry", v)} type="date" required hint="Document must be valid" />
          </div>
          <DocumentUpload label={data.documentType === "passport" ? "Photo Page" : "Front of Document"}
            description={data.documentType === "passport" ? "Upload the photo page of your passport" : "Upload the front side of your ID"}
            icon="📷" url={data.documentFrontUrl ?? ""} onUpload={(f) => onUpload("documentFrontUrl", f)} required
            hint="Ensure all text is clearly readable. No glare or blur." />
          {selectedDocType?.needsBack && (
            <DocumentUpload label="Back of Document" description="Upload the back side of your ID"
              icon="📷" url={data.documentBackUrl ?? ""} onUpload={(f) => onUpload("documentBackUrl", f)} required
              hint="Make sure the entire document is visible within the frame." />
          )}
          <DocumentUpload label="Selfie Holding Your ID" description="Take a clear photo of yourself holding your ID next to your face"
            icon="🤳" url={data.selfieWithIdUrl ?? ""} onUpload={(f) => onUpload("selfieWithIdUrl", f)} required
            hint="Your face and the ID document must both be clearly visible." />
          <DocumentUpload label="Clear Face Photo" description="Upload a recent, clear photo of just your face"
            icon="🧑" url={data.selfieUrl ?? ""} onUpload={(f) => onUpload("selfieUrl", f)} required
            hint="Good lighting, neutral background." />
          <div className="rounded-[14px] border px-4 py-3 flex items-start gap-2"
            style={{ background: "rgba(239,57,118,0.06)", borderColor: "rgba(239,57,118,0.2)" }}>
            <span className="text-[15px] flex-shrink-0">⚠️</span>
            <p className="text-[11px]" style={{ color: MUTED }}>Submitting fraudulent documents will result in permanent account termination.</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 3: Creator Profile ──────────────────────────────────────────────────

const CATEGORIES: { value: ContentCategory; label: string; icon: string }[] = [
  { value: "lifestyle", label: "Lifestyle", icon: "✨" },
  { value: "fitness",   label: "Fitness",   icon: "💪" },
  { value: "art",       label: "Art",       icon: "🎨" },
  { value: "music",     label: "Music",     icon: "🎵" },
  { value: "gaming",    label: "Gaming",    icon: "🎮" },
  { value: "cooking",   label: "Cooking",   icon: "🍳" },
  { value: "fashion",   label: "Fashion",   icon: "👗" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "comedy",    label: "Comedy",    icon: "😂" },
  { value: "adult",     label: "Adult 18+", icon: "🔞" },
  { value: "other",     label: "Other",     icon: "📦" },
];

function StepProfile({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  const selectedCategories: ContentCategory[] = JSON.parse(data.categories || "[]");
  const socialLinks = JSON.parse(data.socialLinks || "{}");
  const toggleCategory = (cat: ContentCategory) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onChange("categories", JSON.stringify(next));
  };
  const setSocial = (key: string, val: string) =>
    onChange("socialLinks", JSON.stringify({ ...socialLinks, [key]: val }));
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-black" style={{ color: TEXT }}>Creator Profile</h2>
        <p className="text-[12px] mt-1" style={{ color: MUTED }}>Tell us about yourself and the content you'll be creating.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Display Name" value={data.displayName ?? ""} onChange={(v) => onChange("displayName", v)} required placeholder="How fans will see your name" />
        <Input label="Username"     value={data.username    ?? ""} onChange={(v) => onChange("username",    v)} required placeholder="@yourhandle" hint="Letters, numbers and underscores only" />
      </div>
      <Textarea label="Bio" value={data.bio ?? ""} onChange={(v) => onChange("bio", v)} required
        placeholder="Tell your future fans what they'll get by subscribing…" rows={4} maxLength={500} />
      <FieldGroup>
        <Label>Content Categories <span style={{ color: P }}>*</span></Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.value);
            return (
              <button key={cat.value} onClick={() => toggleCategory(cat.value)}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition-all"
                style={selected
                  ? { background: cat.value === "adult" ? "rgba(239,57,118,0.15)" : "rgba(124,58,237,0.15)", borderColor: cat.value === "adult" ? P : V, color: TEXT }
                  : { background: "rgba(255,255,255,0.02)", borderColor: BORDER, color: MUTED }}>
                <span>{cat.icon}</span>{cat.label}
              </button>
            );
          })}
        </div>
        {selectedCategories.includes("adult") && (
          <div className="rounded-xl border px-3 py-2.5 flex items-start gap-2 mt-1"
            style={{ background: "rgba(239,57,118,0.06)", borderColor: "rgba(239,57,118,0.25)" }}>
            <span>🔞</span>
            <p className="text-[10px]" style={{ color: MUTED }}>Adult content creators must be verified 18+ and comply with our adult content policy.</p>
          </div>
        )}
      </FieldGroup>
      <FieldGroup>
        <Label>Monthly Subscription Price <span style={{ color: P }}>*</span></Label>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-black" style={{ color: MUTED }}>$</span>
          <input type="number" min="0" max="999" step="0.01"
            value={(parseInt(data.subscriptionPrice ?? "499") / 100).toFixed(2)}
            onChange={(e) => onChange("subscriptionPrice", Math.round(parseFloat(e.target.value) * 100))}
            className="w-28 rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
          <span className="text-[12px]" style={{ color: MUTED }}>per month · Set to 0 for free page</span>
        </div>
      </FieldGroup>
      <div className="flex flex-col gap-3">
        <Toggle checked={data.hasPreviousExperience ?? false} onChange={(v) => onChange("hasPreviousExperience", v)}
          label="I've created content on other platforms before" />
        {data.hasPreviousExperience && (
          <Input label="Which platforms?" value={data.previousPlatforms ?? ""} onChange={(v) => onChange("previousPlatforms", v)} placeholder="e.g. OnlyFans, Patreon, YouTube…" />
        )}
      </div>
      <Textarea label="Content Description" value={data.contentDescription ?? ""} onChange={(v) => onChange("contentDescription", v)}
        placeholder="Describe the type of content you'll be posting in more detail…" rows={3} maxLength={1000} />
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>Social Links (optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Twitter / X"  value={socialLinks.twitter   ?? ""} onChange={(v) => setSocial("twitter",   v)} placeholder="https://twitter.com/yourhandle" />
          <Input label="Instagram"    value={socialLinks.instagram  ?? ""} onChange={(v) => setSocial("instagram", v)} placeholder="https://instagram.com/yourhandle" />
          <Input label="TikTok"       value={socialLinks.tiktok     ?? ""} onChange={(v) => setSocial("tiktok",    v)} placeholder="https://tiktok.com/@yourhandle" />
          <Input label="YouTube"      value={socialLinks.youtube    ?? ""} onChange={(v) => setSocial("youtube",   v)} placeholder="https://youtube.com/@yourhandle" />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Payout Info ──────────────────────────────────────────────────────

const CRYPTO_OPTIONS = [
  { value: "BTC",  label: "Bitcoin (BTC)"   },
  { value: "ETH",  label: "Ethereum (ETH)"  },
  { value: "USDT", label: "Tether (USDT)"   },
  { value: "USDC", label: "USD Coin (USDC)" },
];

function StepPayout({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  const method = data.payoutMethod ?? "bank";
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-black" style={{ color: TEXT }}>Payout Information</h2>
        <p className="text-[12px] mt-1" style={{ color: MUTED }}>Tell us how you'd like to receive your earnings.</p>
      </div>
      <div className="rounded-[14px] border px-4 py-3 flex items-start gap-2"
        style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)" }}>
        <span className="text-[15px]">💵</span>
        <p className="text-[11px]" style={{ color: MUTED }}>Fanzluv takes a 20% platform fee. You receive 80% of your earnings. Minimum payout is $20.</p>
      </div>
      <FieldGroup>
        <Label>Payout Method <span style={{ color: P }}>*</span></Label>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: "bank", label: "Bank Transfer", icon: "🏦" }, { value: "crypto", label: "Cryptocurrency", icon: "₿" }].map((m) => (
            <button key={m.value} onClick={() => onChange("payoutMethod", m.value)}
              className="flex items-center gap-3 rounded-[14px] border p-4 transition-all"
              style={method === m.value
                ? { background: "rgba(124,58,237,0.12)", borderColor: V, boxShadow: `0 0 12px rgba(124,58,237,0.15)` }
                : { background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
              <span className="text-2xl">{m.icon}</span>
              <p className="text-[13px] font-black" style={{ color: method === m.value ? TEXT : MUTED }}>{m.label}</p>
            </button>
          ))}
        </div>
      </FieldGroup>
      {method === "bank" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Account Name" value={data.bankAccountName ?? ""} onChange={(v) => onChange("bankAccountName", v)} required placeholder="Name on bank account" />
            <Input label="Bank Name"    value={data.bankName        ?? ""} onChange={(v) => onChange("bankName",        v)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Account Number / IBAN"       value={data.bankAccountNumber ?? ""} onChange={(v) => onChange("bankAccountNumber", v)} required />
            <Input label="Routing / SWIFT / Sort Code" value={data.bankRoutingNumber ?? ""} onChange={(v) => onChange("bankRoutingNumber", v)} required />
          </div>
          <Select label="Bank Country" value={data.bankCountry ?? ""} onChange={(v) => onChange("bankCountry", v)} options={COUNTRIES} required />
        </div>
      )}
      {method === "crypto" && (
        <div className="flex flex-col gap-4">
          <Select label="Cryptocurrency" value={data.cryptoCurrency ?? ""} onChange={(v) => onChange("cryptoCurrency", v)} options={CRYPTO_OPTIONS} required />
          <Input label="Wallet Address" value={data.cryptoWalletAddress ?? ""} onChange={(v) => onChange("cryptoWalletAddress", v)} required
            placeholder="Your wallet address" hint="Double-check your address. Incorrect addresses cannot be recovered." />
        </div>
      )}
      <div className="flex flex-col gap-4 pt-2 border-t" style={{ borderColor: BORDER }}>
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.35)" }}>Tax Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Tax Country" value={data.taxCountry ?? ""} onChange={(v) => onChange("taxCountry", v)} options={COUNTRIES} required />
          <Input label="Tax ID / SSN / VAT Number" value={data.taxId ?? ""} onChange={(v) => onChange("taxId", v)} required hint="Required for earnings over $600/year" />
        </div>
        <Toggle checked={data.isBusinessAccount ?? false} onChange={(v) => onChange("isBusinessAccount", v)}
          label="I'm registering as a business / company" description="If you operate as a business entity, toggle this on" />
        {data.isBusinessAccount && (
          <Input label="Business / Company Name" value={data.businessName ?? ""} onChange={(v) => onChange("businessName", v)} required />
        )}
      </div>
    </div>
  );
}

// ─── Step 5: Agreements ───────────────────────────────────────────────────────

function CheckItem({ checked, onChange, label, description, required, link }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; description?: string; required?: boolean; link?: { text: string; href: string };
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
      <button onClick={() => onChange(!checked)}
        className="size-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        style={{ background: checked ? GRAD : "transparent", borderColor: checked ? "transparent" : BORDER }}>
        {checked && <span className="text-white text-[10px] font-black">✓</span>}
      </button>
      <div className="flex-1">
        <p className="text-[12px] font-bold" style={{ color: TEXT }}>
          {label}{required && <span style={{ color: P }}> *</span>}
          {link && <a href={link.href} target="_blank" rel="noopener noreferrer" className="ml-1.5 underline" style={{ color: V }}>{link.text}</a>}
        </p>
        {description && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{description}</p>}
      </div>
    </div>
  );
}

function StepAgreements({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-black" style={{ color: TEXT }}>Agreements & Confirmation</h2>
        <p className="text-[12px] mt-1" style={{ color: MUTED }}>Please read and agree to all terms before submitting your application.</p>
      </div>
      <div className="rounded-[16px] border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
        <CheckItem checked={data.agreedToAge18         ?? false} onChange={(v) => onChange("agreedToAge18",          v)} required label="I confirm I am 18 years of age or older" description="You must be at least 18 years old to become a creator on Fanzluv." />
        <CheckItem checked={data.agreedToTerms         ?? false} onChange={(v) => onChange("agreedToTerms",          v)} required label="I agree to the Terms of Service" link={{ text: "Read Terms", href: "/terms" }} />
        <CheckItem checked={data.agreedToContentPolicy ?? false} onChange={(v) => onChange("agreedToContentPolicy",  v)} required label="I agree to the Content Policy" description="I will only post legal, consensual content and will not post content involving minors." link={{ text: "Read Policy", href: "/content-policy" }} />
        <CheckItem checked={data.agreedToPrivacyPolicy ?? false} onChange={(v) => onChange("agreedToPrivacyPolicy",  v)} required label="I agree to the Privacy Policy" link={{ text: "Read Policy", href: "/privacy" }} />
        <CheckItem checked={data.agreedToTaxObligations ?? false} onChange={(v) => onChange("agreedToTaxObligations", v)} required label="I understand my tax obligations" description="I am responsible for reporting and paying taxes on income earned through Fanzluv." />
      </div>
      <FieldGroup>
        <Label>Electronic Signature <span style={{ color: P }}>*</span></Label>
        <p className="text-[11px]" style={{ color: MUTED }}>Type your full legal name exactly as it appears on your ID to sign this application.</p>
        <input type="text" value={data.signature ?? ""} placeholder="Your full legal name"
          onChange={(e) => onChange("signature", e.target.value)}
          className="rounded-xl border px-3.5 py-3 text-[14px] font-bold outline-none"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "'Caveat', cursive, inherit" }} />
        {data.signature && (
          <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.35)" }}>
            Signed on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </FieldGroup>
    </div>
  );
}

// ─── Status screens ───────────────────────────────────────────────────────────

function StatusScreen({ status, rejectionReason, onReapply }: {
  status: ApplicationStatus; rejectionReason: string | null; onReapply: () => void;
}) {
  const screens: Record<string, { icon: string; title: string; body: string; color: string }> = {
    submitted:          { icon: "🎉", color: "#4ade80", title: "Application Submitted!",           body: "Your application is being reviewed. This usually takes 1–3 business days." },
    under_review:       { icon: "🔍", color: "#38bdf8", title: "Under Review",                      body: "Our team is currently reviewing your application. We'll be in touch soon." },
    approved:           { icon: "✅", color: "#4ade80", title: "Application Approved! 🎊",           body: "Congratulations! Your creator account is now active." },
    rejected:           { icon: "❌", color: P,         title: "Application Not Approved",           body: rejectionReason || "Your application did not meet our current requirements. You may reapply after 30 days." },
    more_info_required: { icon: "📋", color: "#fbbf24", title: "More Information Required",          body: rejectionReason || "We need additional information to process your application." },
  };
  const s = screens[status];
  if (!s) return null;
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="size-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: s.color + "18", border: `2px solid ${s.color}40` }}>{s.icon}</div>
      <div className="max-w-md">
        <h2 className="text-[20px] font-black" style={{ color: TEXT }}>{s.title}</h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: MUTED }}>{s.body}</p>
      </div>
      {status === "approved" && (
        <Link href="/dashboard/creator/overview" className="px-6 py-3 rounded-xl text-[13px] font-black text-white" style={{ background: GRAD }}>
          Go to Creator Dashboard →
        </Link>
      )}
      {status === "rejected" && (
        <button onClick={onReapply} className="px-6 py-3 rounded-xl text-[13px] font-black border" style={{ borderColor: BORDER, color: MUTED }}>
          Start New Application
        </button>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CreatorApplicationForm() {
  const { application, isLoading, isSaving, isSubmitting, error,
          saveStep, submit, uploadDocument, clearError } = useCreatorApply();

  const [localStep, setLocalStep]         = useState(1);
  const [stepErrors, setStepErrors]       = useState<string[]>([]);
  const [showErrors, setShowErrors]       = useState(false);

  const step = application?.currentStep ?? localStep;
  const data = application ?? {};

  // ── Recompute validation live so the button state is reactive ──────────────
  const currentErrors = VALIDATORS[step - 1]?.(data) ?? [];
  const canProceed    = currentErrors.length === 0;

  const handleFieldChange = useCallback(async (key: string, value: any) => {
    // Clear shown errors when user starts fixing things
    setShowErrors(false);
    await saveStep({ [key]: value });
  }, [saveStep]);

  const handleUpload = useCallback(async (field: string, file: File) => {
    setShowErrors(false);
    await uploadDocument(field, file);
  }, [uploadDocument]);

  const handleNext = useCallback(async () => {
    // Re-run validation against latest data
    const errors = VALIDATORS[step - 1]?.(data) ?? [];
    if (errors.length > 0) {
      setStepErrors(errors);
      setShowErrors(true);
      // Scroll to top of form card so errors are visible
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setShowErrors(false);
    setStepErrors([]);
    const nextStep = Math.min(step + 1, 5);
    const ok = await saveStep({ currentStep: nextStep });
    if (ok) setLocalStep(nextStep);
  }, [step, data, saveStep]);

  const handleBack = useCallback(() => {
    setShowErrors(false);
    setStepErrors([]);
    const prevStep = Math.max(step - 1, 1);
    saveStep({ currentStep: prevStep });
    setLocalStep(prevStep);
  }, [step, saveStep]);

  const handleSubmit = useCallback(async () => {
    const errors = VALIDATORS[4]?.(data) ?? [];
    if (errors.length > 0) {
      setStepErrors(errors);
      setShowErrors(true);
      return;
    }
    await submit();
  }, [data, submit]);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto animate-pulse flex flex-col gap-4">
        <div className="h-12 rounded-2xl" style={{ background: CARD }} />
        <div className="h-80 rounded-2xl" style={{ background: CARD }} />
      </div>
    );
  }

  const status = application?.status as ApplicationStatus;
  if (["submitted", "under_review", "approved", "rejected", "more_info_required"].includes(status)) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-[20px] border p-8" style={{ background: CARD, borderColor: BORDER }}>
        <StatusScreen status={status} rejectionReason={application?.rejectionReason ?? null}
          onReapply={() => saveStep({ status: "draft", currentStep: 1 })} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>

      {/* Header */}
      <div>
        <h1 className="text-[24px] font-black" style={{ color: TEXT }}>Become a Creator</h1>
        <p className="text-[13px] mt-1" style={{ color: MUTED }}>
          Complete the form below to apply. Applications are reviewed within 1–3 business days.
        </p>
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      {/* API error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span>
          <p className="flex-1 text-[12px] font-bold" style={{ color: P }}>{error}</p>
          <button onClick={clearError}>✕</button>
        </div>
      )}

      {/* Validation errors — shown when user clicks Continue with missing fields */}
      {showErrors && <ValidationErrors errors={stepErrors} />}

      {/* Form card */}
      <div className="rounded-[20px] border p-6 flex flex-col gap-6"
        style={{ background: CARD, borderColor: BORDER }}>

        {step === 1 && <StepPersonal   data={data} onChange={handleFieldChange} />}
        {step === 2 && <StepIdentity   data={data} onChange={handleFieldChange} onUpload={handleUpload} />}
        {step === 3 && <StepProfile    data={data} onChange={handleFieldChange} />}
        {step === 4 && <StepPayout     data={data} onChange={handleFieldChange} />}
        {step === 5 && <StepAgreements data={data} onChange={handleFieldChange} />}

        <NavButtons
          step={step}
          total={5}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isLoading={isSaving || isSubmitting}
          isLast={step === 5}
          canProceed={canProceed}
        />
      </div>

      {/* Auto-save note */}
      <p className="text-center text-[10px]" style={{ color: "rgba(240,234,255,0.25)" }}>
        💾 Your progress is saved automatically as you fill out each field
      </p>
    </div>
  );
}