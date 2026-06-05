"use client";

// ─── Theme ────────────────────────────────────────────────────────────────────
export const P    = "#ef3976";
export const V    = "#7c3aed";
export const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
export const CARD = "#1a1635";
export const SURF = "#13112b";
export const BORDER = "rgba(124,58,237,0.18)";

export function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
export function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[14px] font-black text-[#f0eaff]">{title}</h3>
        {description && <p className="text-[11px] mt-0.5" style={{ color: "rgba(240,234,255,0.45)" }}>{description}</p>}
      </div>
      <div className="rounded-[16px] border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
        {children}
      </div>
    </div>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────
export function SettingRow({ label, description, children, danger }: {
  label: string; description?: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b last:border-b-0"
      style={{ borderColor: "rgba(124,58,237,0.08)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold" style={{ color: danger ? P : "#f0eaff" }}>{label}</p>
        {description && <p className="text-[11px] mt-0.5" style={{ color: "rgba(240,234,255,0.4)" }}>{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="relative inline-flex items-center h-6 w-11 rounded-full transition-all duration-200 flex-shrink-0"
      style={{
        background: checked ? GRAD : "rgba(124,58,237,0.15)",
        border: `1px solid ${checked ? "transparent" : BORDER}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="inline-block size-4 rounded-full bg-white transition-transform duration-200 shadow-sm"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Text input ───────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, type = "text", placeholder = "", hint, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
        {label}
      </label>
      <input
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3 py-2.5 text-[13px] outline-none transition-all"
        style={{
          background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
          borderColor: BORDER, color: disabled ? "rgba(240,234,255,0.4)" : "#f0eaff",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {hint && <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>{hint}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder = "", rows = 3, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
          {label}
        </label>
        {maxLength && (
          <span className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value} placeholder={placeholder} rows={rows} maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3 py-2.5 text-[13px] outline-none resize-none transition-all"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: "#f0eaff" }}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
        {label}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3 py-2.5 text-[13px] outline-none"
        style={{ background: SURF, borderColor: BORDER, color: "#f0eaff" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>{hint}</p>}
    </div>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────
export function SaveButton({ onClick, isSaving, saved, disabled }: {
  onClick: () => void; isSaving: boolean; saved: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isSaving || disabled}
      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-black text-white transition-all"
      style={{
        background: saved ? "rgba(34,197,94,0.8)" : GRAD,
        opacity: isSaving || disabled ? 0.6 : 1,
        boxShadow: saved ? "0 4px 16px rgba(34,197,94,0.3)" : "0 4px 16px rgba(124,58,237,0.3)",
      }}
    >
      {isSaving ? (
        <><svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>Saving…</>
      ) : saved ? "✓ Saved!" : "Save Changes"}
    </button>
  );
}

// ─── Danger button ────────────────────────────────────────────────────────────
export function DangerButton({ children, onClick, disabled }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-black border transition-all"
      style={{
        background: "rgba(239,57,118,0.08)",
        borderColor: "rgba(239,57,118,0.3)",
        color: P,
        opacity: disabled ? 0.5 : 1,
      }}>
      {children}
    </button>
  );
}

// ─── Radio pill group ─────────────────────────────────────────────────────────
export function RadioGroup({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition-all"
          style={value === o.value
            ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: "#f0eaff" }
            : { background: "rgba(255,255,255,0.02)", borderColor: BORDER, color: "rgba(240,234,255,0.5)" }
          }
        >
          {o.icon && <span>{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}