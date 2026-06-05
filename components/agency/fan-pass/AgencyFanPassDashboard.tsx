"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CreateSeasonForm, CreateSeasonPayload } from "@/components/agency/fan-pass/CreateSeasonForm";
import type {
  FanPassSeason,
  PassRewardItem,
  DayConfigItem,
  MilestoneItem,
  SeasonAnalytics,
  RewardFormData,
  SeasonFormData,
} from "@/lib/types";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const BG   = "#0d0d1a";
const CARD = "#1a1635";
const SURF = "#13112b";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: FanPassSeason["status"] }) {
  const map = {
    draft:  { label: "Draft",  bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
    active: { label: "Live",   bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
    ended:  { label: "Ended",  bg: "rgba(239,57,118,0.12)",  color: P         },
  };
  const s = map[status];
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider flex-shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {status === "active" && <span className="inline-block size-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />}
      {s.label}
    </span>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, icon, children, action }: {
  title: string; icon: string; children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border overflow-hidden" style={{ background: CARD, borderColor: "rgba(124,58,237,0.18)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(124,58,237,0.12)", background: SURF }}>
        <div className="flex items-center gap-2">
          <span className="text-[15px]">{icon}</span>
          <h3 className="text-[13px] font-black text-[#f0eaff]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = "text", placeholder = "", min, max, step }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.45)" }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} step={step}
        className="rounded-xl border px-3 py-2.5 text-[13px] font-semibold outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.03)", borderColor: "rgba(124,58,237,0.2)",
          color: "#f0eaff",
        }}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.45)" }}>
        {label}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3 py-2.5 text-[13px] font-semibold outline-none"
        style={{ background: SURF, borderColor: "rgba(124,58,237,0.2)", color: "#f0eaff" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Gradient button ──────────────────────────────────────────────────────────
function GradBtn({ children, onClick, disabled, size = "md", variant = "primary", className }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  size?: "sm" | "md"; variant?: "primary" | "ghost" | "danger"; className?: string;
}) {
  const sizes = { sm: "px-3 py-1.5 text-[10px]", md: "px-4 py-2 text-[12px]" };
  const variants = {
    primary: { background: GRAD, color: "#fff", border: "none", opacity: disabled ? 0.5 : 1 },
    ghost:   { background: "rgba(124,58,237,0.1)", color: "rgba(240,234,255,0.7)", border: "1px solid rgba(124,58,237,0.25)", opacity: disabled ? 0.5 : 1 },
    danger:  { background: "rgba(239,57,118,0.12)", color: P, border: "1px solid rgba(239,57,118,0.3)", opacity: disabled ? 0.5 : 1 },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("rounded-xl font-black transition-all duration-150 flex items-center gap-1.5", sizes[size], className)}
      style={variants[variant] as any}>
      {children}
    </button>
  );
}

// ─── Analytics panel ──────────────────────────────────────────────────────────
function AnalyticsPanel({ analytics }: { analytics: SeasonAnalytics }) {
  const stats = [
    { label: "Total Fans",      value: analytics.totalParticipants.toLocaleString(),    icon: "👥", color: V        },
    { label: "VIP Subs",        value: analytics.totalVip.toLocaleString(),             icon: "💎", color: "#fbbf24"},
    { label: "VIP Rate",        value: `${analytics.vipConversionRate.toFixed(1)}%`,   icon: "📈", color: "#4ade80"},
    { label: "Avg Level",       value: analytics.avgLevel.toFixed(1),                  icon: "⭐", color: P        },
    { label: "Avg Streak",      value: `${analytics.avgStreak.toFixed(1)}d`,           icon: "🔥", color: "#fb923c"},
    { label: "Daily Claim %",   value: `${analytics.dailyClaimRate.toFixed(0)}%`,      icon: "✅", color: "#38bdf8"},
    { label: "XP Distributed",  value: (analytics.totalXpDistributed/1000).toFixed(1)+"k", icon: "⚡", color: "#c084fc"},
    { label: "Est. Revenue",    value: `$${(analytics.revenueEstimateCents/100).toLocaleString()}`, icon: "💰", color: "#4ade80"},
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[14px] border p-4"
            style={{ background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.12)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[14px]">{s.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.35)" }}>
                {s.label}
              </span>
            </div>
            <p className="text-[20px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Level distribution bar chart */}
      <div className="rounded-[14px] border p-4" style={{ background: "rgba(124,58,237,0.04)", borderColor: "rgba(124,58,237,0.1)" }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "rgba(240,234,255,0.35)" }}>
          Level Distribution
        </p>
        <div className="flex items-end gap-2 h-24">
          {analytics.levelDistribution.map((d) => {
            const maxCount = Math.max(...analytics.levelDistribution.map((x) => x.count), 1);
            const pct = (d.count / maxCount) * 100;
            return (
              <div key={d.level} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <span className="text-[8px] font-bold" style={{ color: "rgba(240,234,255,0.5)" }}>{d.count}</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${pct}%`, minHeight: 2, background: GRAD, opacity: 0.8 }} />
                <span className="text-[8px]" style={{ color: "rgba(240,234,255,0.3)" }}>Lv{d.level}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Reward row (editable) ────────────────────────────────────────────────────
function RewardRow({ reward, onEdit, onDelete }: {
  reward: PassRewardItem;
  onEdit: (r: PassRewardItem) => void;
  onDelete: (id: number) => void;
}) {
  const rarityColors: Record<string, string> = {
    common: "#94a3b8", rare: "#38bdf8", epic: V, legendary: "#fbbf24",
  };
  return (
    <div className="flex items-center gap-3 rounded-[12px] border px-4 py-3 group"
      style={{ background: "rgba(124,58,237,0.04)", borderColor: "rgba(124,58,237,0.1)" }}>
      <span className="text-[22px] flex-shrink-0">{reward.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[12px] font-bold text-[#f0eaff] truncate">{reward.label}</p>
          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full"
            style={{ background: rarityColors[reward.rarity] + "20", color: rarityColors[reward.rarity] }}>
            {reward.rarity}
          </span>
          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full"
            style={{ background: reward.tier === "vip" ? "rgba(239,57,118,0.15)" : "rgba(124,58,237,0.12)", color: reward.tier === "vip" ? P : V }}>
            {reward.tier}
          </span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.4)" }}>
          Level {reward.level} · {reward.rewardType} · {reward.rewardAmount.toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GradBtn size="sm" variant="ghost" onClick={() => onEdit(reward)}>✏️ Edit</GradBtn>
        <GradBtn size="sm" variant="danger" onClick={() => onDelete(reward.id)}>🗑</GradBtn>
      </div>
    </div>
  );
}

// ─── Day config slot ──────────────────────────────────────────────────────────
function DaySlotEditor({ day, seasonId, onSaved }: {
  day: DayConfigItem; seasonId: number; onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [icon, setIcon]       = useState(day.icon);
  const [amount, setAmount]   = useState(String(day.rewardAmount));
  const [label, setLabel]     = useState(day.rewardLabel);
  const [type, setType]       = useState(day.rewardType);
  const [special, setSpecial] = useState(day.isSpecialDay);
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/agency/fan-pass/seasons/${seasonId}?view=dayconfig`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daySlot: day.daySlot, icon, rewardAmount: Number(amount), rewardLabel: label, rewardType: type, isSpecialDay: special }),
    });
    setSaving(false);
    setEditing(false);
    onSaved();
  };

  return (
    <div className="rounded-[14px] border overflow-hidden"
      style={{ background: special ? "rgba(251,191,36,0.06)" : "rgba(124,58,237,0.04)", borderColor: special ? "rgba(251,191,36,0.25)" : "rgba(124,58,237,0.12)" }}>
      <div className="flex items-center gap-3 p-3">
        <div className="size-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.12)" }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-[#f0eaff]">{day.label}</p>
          <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.4)" }}>{label}</p>
        </div>
        <button onClick={() => setEditing(!editing)}
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all"
          style={{ background: editing ? "rgba(239,57,118,0.12)" : "rgba(124,58,237,0.1)", borderColor: editing ? "rgba(239,57,118,0.3)" : "rgba(124,58,237,0.2)", color: editing ? P : V }}>
          {editing ? "Cancel" : "✏️"}
        </button>
      </div>

      {editing && (
        <div className="px-3 pb-3 flex flex-col gap-3 border-t" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Input label="Icon (emoji)" value={icon} onChange={setIcon} />
            <Input label="Amount" value={amount} onChange={setAmount} type="number" />
            <Select label="Type" value={type} onChange={setType} options={[
              { value: "xp", label: "XP" }, { value: "coins", label: "Coins" },
              { value: "badge", label: "Badge" }, { value: "mystery_box", label: "Mystery Box" },
            ]} />
            <Input label="Label" value={label} onChange={setLabel} placeholder="+50 XP" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)}
              className="rounded" />
            <span className="text-[11px] font-bold text-[#f0eaff]">Special day (highlighted) ⭐</span>
          </label>
          <GradBtn onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Day"}
          </GradBtn>
        </div>
      )}
    </div>
  );
}

// ─── Milestone row editor ─────────────────────────────────────────────────────
function MilestoneEditor({ milestone, seasonId, onSaved, onDelete }: {
  milestone: MilestoneItem; seasonId: number; onSaved: () => void; onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [icon, setIcon]       = useState(milestone.icon);
  const [title, setTitle]     = useState(milestone.title);
  const [days, setDays]       = useState(String(milestone.streakDays));
  const [type, setType]       = useState(milestone.rewardType);
  const [amount, setAmount]   = useState(String(milestone.rewardAmount));
  const [label, setLabel]     = useState(milestone.rewardLabel);
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/agency/fan-pass/milestones/${milestone.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streakDays: Number(days), icon, title, rewardType: type, rewardAmount: Number(amount), rewardLabel: label }),
    });
    setSaving(false);
    setEditing(false);
    onSaved();
  };

  return (
    <div className="rounded-[14px] border overflow-hidden group"
      style={{ background: "rgba(124,58,237,0.04)", borderColor: "rgba(124,58,237,0.1)" }}>
      <div className="flex items-center gap-3 p-3">
        <span className="text-[22px]">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-[#f0eaff]">{title}</p>
          <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.4)" }}>
            {days}-day streak · {label}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setEditing(!editing)} className="text-[11px] font-bold px-2 py-1 rounded-lg border"
            style={{ background: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.2)", color: V }}>
            ✏️
          </button>
          <button onClick={() => onDelete(milestone.id)} className="text-[11px] font-bold px-2 py-1 rounded-lg border"
            style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.2)", color: P }}>
            🗑
          </button>
        </div>
      </div>

      {editing && (
        <div className="px-3 pb-3 border-t grid grid-cols-2 gap-2 pt-3" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
          <Input label="Icon" value={icon} onChange={setIcon} />
          <Input label="Title" value={title} onChange={setTitle} />
          <Input label="Streak Days" value={days} onChange={setDays} type="number" />
          <Input label="Reward Label" value={label} onChange={setLabel} placeholder="+200 Coins" />
          <Select label="Type" value={type} onChange={setType} options={[
            { value: "xp", label: "XP" }, { value: "coins", label: "Coins" },
            { value: "badge", label: "Badge" }, { value: "mystery_box", label: "Mystery Box" },
          ]} />
          <Input label="Amount" value={amount} onChange={setAmount} type="number" />
          <div className="col-span-2">
            <GradBtn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Milestone"}</GradBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add/Edit Reward Modal ────────────────────────────────────────────────────
function RewardModal({ reward, seasonId, onSave, onClose }: {
  reward: PassRewardItem | null; seasonId: number;
  onSave: () => void; onClose: () => void;
}) {
  const isEdit = !!reward;
  const [form, setForm] = useState<RewardFormData>({
    level:        reward?.level ?? 1,
    tier:         reward?.tier ?? "free",
    icon:         reward?.icon ?? "🎁",
    label:        reward?.label ?? "",
    description:  reward?.description ?? "",
    rewardType:   reward?.rewardType ?? "xp",
    rewardAmount: reward?.rewardAmount ?? 100,
    isVipOnly:    reward?.isVipOnly ?? false,
    rarity:       reward?.rarity ?? "common",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof RewardFormData) => (v: string | number | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const url = isEdit
      ? `/api/agency/fan-pass/rewards/${reward!.id}`
      : `/api/agency/fan-pass/seasons/${seasonId}`;
    await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.9)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-[24px] border overflow-hidden"
        style={{ background: CARD, borderColor: "rgba(124,58,237,0.3)", boxShadow: "0 20px 60px rgba(124,58,237,0.2)" }}>
        <div className="h-0.5" style={{ background: GRAD }} />
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-black text-[#f0eaff]">
              {isEdit ? "Edit Reward" : "Add Reward"}
            </h3>
            <button onClick={onClose} className="text-[18px] opacity-40 hover:opacity-80">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Level" value={form.level} onChange={(v) => set("level")(Number(v))} type="number" min={1} />
            <Input label="Icon (emoji)" value={form.icon} onChange={set("icon")} placeholder="🎁" />
            <Input label="Label" value={form.label} onChange={set("label")} placeholder="Mystery Box" />
            <Input label="Amount" value={form.rewardAmount} onChange={(v) => set("rewardAmount")(Number(v))} type="number" />
            <Select label="Track Tier" value={form.tier} onChange={set("tier") as any} options={[
              { value: "free", label: "Free Track" },
              { value: "vip",  label: "VIP Track"  },
            ]} />
            <Select label="Reward Type" value={form.rewardType} onChange={set("rewardType")} options={[
              { value: "xp",             label: "XP"              },
              { value: "coins",          label: "Coins"           },
              { value: "badge",          label: "Badge"           },
              { value: "booster_xp",     label: "XP Booster"     },
              { value: "streak_freeze",  label: "Streak Freeze"   },
              { value: "mystery_box",    label: "Mystery Box"     },
              { value: "exclusive_content", label: "Exclusive Content" },
            ]} />
            <Select label="Rarity" value={form.rarity} onChange={set("rarity") as any} options={[
              { value: "common",    label: "Common"    },
              { value: "rare",      label: "Rare"      },
              { value: "epic",      label: "Epic"      },
              { value: "legendary", label: "Legendary" },
            ]} />
            <div className="flex items-center gap-2 self-end pb-2">
              <input type="checkbox" checked={form.isVipOnly}
                onChange={(e) => set("isVipOnly")(e.target.checked)} className="rounded" />
              <label className="text-[11px] font-bold text-[#f0eaff]">VIP Only</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <GradBtn variant="ghost" onClick={onClose} className="flex-1">Cancel</GradBtn>
            <GradBtn onClick={save} disabled={saving} className="flex-[2]">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Reward"}
            </GradBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Season card ──────────────────────────────────────────────────────────────
function SeasonCard({ season, isSelected, onSelect, onStatusChange, onDelete }: {
  season: FanPassSeason; isSelected: boolean;
  onSelect: () => void; onStatusChange: (s: FanPassSeason["status"]) => void;
  onDelete: () => void;
}) {
  const start = new Date(season.startDate).toLocaleDateString();
  const end   = new Date(season.endDate).toLocaleDateString();
  const daysLeft = Math.max(0, Math.ceil((new Date(season.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div
      onClick={onSelect}
      className="rounded-[16px] border p-4 cursor-pointer transition-all duration-150"
      style={{
        background: isSelected ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.04)",
        borderColor: isSelected ? V : "rgba(124,58,237,0.15)",
        boxShadow: isSelected ? `0 0 20px rgba(124,58,237,0.15)` : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-black text-[#f0eaff] truncate">{season.name}</h4>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.4)" }}>
            {start} → {end}
          </p>
        </div>
        <StatusBadge status={season.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Fans",    value: season.totalParticipants.toLocaleString() },
          { label: "VIP",     value: season.totalVipSubscribers.toLocaleString() },
          { label: "Days left", value: season.status === "active" ? `${daysLeft}d` : "—" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[14px] font-black text-[#f0eaff]">{s.value}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.3)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {season.status === "draft" && (
          <GradBtn size="sm" onClick={() => onStatusChange("active")} className="flex-1">
            🚀 Go Live
          </GradBtn>
        )}
        {season.status === "active" && (
          <GradBtn size="sm" variant="ghost" onClick={() => onStatusChange("ended")} className="flex-1">
            ⏹ End Season
          </GradBtn>
        )}
        {season.status !== "active" && (
          <GradBtn size="sm" variant="danger" onClick={onDelete}>🗑</GradBtn>
        )}
      </div>
    </div>
  );
}


// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
type AgencyTab = "seasons" | "rewards" | "daily-bonus" | "milestones" | "analytics";

export default function AgencyFanPassDashboard() {
  const [seasons, setSeasons]         = useState<FanPassSeason[]>([]);
  const [selectedSeason, setSelected] = useState<FanPassSeason | null>(null);
  const [activeTab, setActiveTab]     = useState<AgencyTab>("seasons");
  const [rewards, setRewards]         = useState<PassRewardItem[]>([]);
  const [dayConfig, setDayConfig]     = useState<DayConfigItem[]>([]);
  const [milestones, setMilestones]   = useState<MilestoneItem[]>([]);
  const [analytics, setAnalytics]     = useState<SeasonAnalytics | null>(null);
  const [editReward, setEditReward]   = useState<PassRewardItem | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [loading, setLoading]         = useState(false);

  // ── Fetch seasons ───────────────────────────────────────────────────────────
  const fetchSeasons = useCallback(async () => {
    const res = await fetch("/api/agency/fan-pass/seasons");
    if (!res.ok) return;
    const data = await res.json();
    setSeasons(data.seasons ?? []);
    if (!selectedSeason && data.seasons?.length > 0) {
      setSelected(data.seasons.find((s: FanPassSeason) => s.status === "active") ?? data.seasons[0]);
    }
  }, [selectedSeason]);

  // ── Fetch season detail based on tab ───────────────────────────────────────
  const fetchDetail = useCallback(async (season: FanPassSeason, tab: AgencyTab) => {
    if (tab === "seasons") return;
    setLoading(true);
    const view = tab === "rewards" ? "rewards" : tab === "daily-bonus" ? "dayconfig" : tab === "milestones" ? "milestones" : "analytics";
    const res = await fetch(`/api/agency/fan-pass/seasons/${season.id}?view=${view}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    if (tab === "rewards")    setRewards(data.rewards ?? []);
    if (tab === "daily-bonus") setDayConfig(data.config ?? []);
    if (tab === "milestones") setMilestones(data.milestones ?? []);
    if (tab === "analytics")  setAnalytics(data.analytics ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSeasons(); }, []);
  useEffect(() => {
    if (selectedSeason && activeTab !== "seasons") fetchDetail(selectedSeason, activeTab);
  }, [selectedSeason, activeTab]);

  const handleStatusChange = async (season: FanPassSeason, status: FanPassSeason["status"]) => {
    await fetch(`/api/agency/fan-pass/seasons/${season.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSeasons();
  };

  const handleDeleteSeason = async (season: FanPassSeason) => {
    if (!confirm(`Delete "${season.name}"? This cannot be undone.`)) return;
    await fetch(`/api/agency/fan-pass/seasons/${season.id}`, { method: "DELETE" });
    setSelected(null);
    fetchSeasons();
  };

  const handleDeleteReward = async (id: number) => {
    await fetch(`/api/agency/fan-pass/rewards/${id}`, { method: "DELETE" });
    if (selectedSeason) fetchDetail(selectedSeason, "rewards");
  };

  const handleDeleteMilestone = async (id: number) => {
    await fetch(`/api/agency/fan-pass/milestones/${id}`, { method: "DELETE" });
    if (selectedSeason) fetchDetail(selectedSeason, "milestones");
  };

  const handleCreateSeason = async (data: CreateSeasonPayload) => {
    const res = await fetch("/api/agency/fan-pass/seasons", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[handleCreateSeason] failed:", err);
      return;
    }
    setShowCreateSeason(false);
    fetchSeasons();
  };

  const TABS: { id: AgencyTab; label: string; icon: string }[] = [
    { id: "seasons",     label: "Seasons",     icon: "📅" },
    { id: "rewards",     label: "Rewards",     icon: "🎁" },
    { id: "daily-bonus", label: "Daily Bonus", icon: "🔥" },
    { id: "milestones",  label: "Milestones",  icon: "🏆" },
    { id: "analytics",   label: "Analytics",   icon: "📊" },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: BG, fontFamily: "'Be Vietnam Pro', sans-serif", color: "#f0eaff" }}>

      {/* ── Page header ── */}
      <div className="border-b px-6 sm:px-10 py-6" style={{ borderColor: "rgba(124,58,237,0.12)", background: SURF }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "rgba(240,234,255,0.3)" }}>Agency Dashboard</span>
                <span style={{ color: "rgba(240,234,255,0.15)" }}>›</span>
                <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: V }}>Fan Pass</span>
              </div>
              <h1 className="text-[24px] font-black text-[#f0eaff] leading-none">Fan Pass Manager</h1>
              <p className="text-[12px] mt-1" style={{ color: "rgba(240,234,255,0.4)" }}>
                Configure seasons, rewards, login bonuses and milestones
              </p>
            </div>

            {selectedSeason && (
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-2.5"
                style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)" }}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.35)" }}>Active Season</p>
                  <p className="text-[13px] font-black text-[#f0eaff]">{selectedSeason.name}</p>
                </div>
                <StatusBadge status={selectedSeason.status} />
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-6 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-[11px] font-black whitespace-nowrap border-b-2 transition-all"
                style={activeTab === tab.id
                  ? { color: "#f0eaff", borderColor: V, background: "rgba(124,58,237,0.1)" }
                  : { color: "rgba(240,234,255,0.4)", borderColor: "transparent" }}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 sm:px-10 py-8 max-w-6xl mx-auto">

        {/* ══ SEASONS TAB ══ */}
        {activeTab === "seasons" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-black text-[#f0eaff]">
                All Seasons <span className="text-[13px] font-bold ml-2" style={{ color: "rgba(240,234,255,0.4)" }}>({seasons.length})</span>
              </h2>
              <GradBtn onClick={() => setShowCreateSeason(!showCreateSeason)}>
                {showCreateSeason ? "✕ Cancel" : "+ New Season"}
              </GradBtn>
            </div>

            {showCreateSeason && (
              <CreateSeasonForm onCreate={handleCreateSeason} onCancel={() => setShowCreateSeason(false)} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasons.map((s) => (
                <SeasonCard key={s.id} season={s}
                  isSelected={selectedSeason?.id === s.id}
                  onSelect={() => setSelected(s)}
                  onStatusChange={(status) => handleStatusChange(s, status)}
                  onDelete={() => handleDeleteSeason(s)}
                />
              ))}
              {seasons.length === 0 && (
                <div className="col-span-3 flex flex-col items-center gap-3 py-16">
                  <span className="text-5xl">📅</span>
                  <p style={{ color: "rgba(240,234,255,0.4)" }}>No seasons yet — create your first one above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ REWARDS TAB ══ */}
        {activeTab === "rewards" && (
          <div className="flex flex-col gap-5">
            {!selectedSeason ? (
              <p style={{ color: "rgba(240,234,255,0.4)" }}>Select a season from the Seasons tab first.</p>
            ) : (
              <SectionCard title="Reward Track" icon="🎁"
                action={
                  <GradBtn size="sm" onClick={() => { setEditReward(null); setShowRewardModal(true); }}>
                    + Add Reward
                  </GradBtn>
                }>
                {loading ? (
                  <div className="flex flex-col gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(124,58,237,0.08)" }} />
                    ))}
                  </div>
                ) : rewards.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {rewards.map((r) => (
                      <RewardRow key={r.id} reward={r}
                        onEdit={(r) => { setEditReward(r); setShowRewardModal(true); }}
                        onDelete={handleDeleteReward}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <span className="text-4xl">🎁</span>
                    <p style={{ color: "rgba(240,234,255,0.35)" }}>No rewards yet — add your first reward</p>
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {/* ══ DAILY BONUS TAB ══ */}
        {activeTab === "daily-bonus" && (
          <div className="flex flex-col gap-5">
            {!selectedSeason ? (
              <p style={{ color: "rgba(240,234,255,0.4)" }}>Select a season first.</p>
            ) : (
              <SectionCard title="7-Day Login Bonus Config" icon="🔥">
                <p className="text-[11px] mb-4" style={{ color: "rgba(240,234,255,0.4)" }}>
                  Configure the reward for each day slot in the weekly login bonus cycle.
                  Day 7 is typically the special bonus day.
                </p>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(124,58,237,0.08)" }} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dayConfig.map((day) => (
                      <DaySlotEditor key={day.daySlot} day={day}
                        seasonId={selectedSeason.id}
                        onSaved={() => fetchDetail(selectedSeason, "daily-bonus")}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {/* ══ MILESTONES TAB ══ */}
        {activeTab === "milestones" && (
          <div className="flex flex-col gap-5">
            {!selectedSeason ? (
              <p style={{ color: "rgba(240,234,255,0.4)" }}>Select a season first.</p>
            ) : (
              <SectionCard title="Streak Milestones" icon="🏆"
                action={
                  <GradBtn size="sm" onClick={async () => {
                    await fetch(`/api/agency/fan-pass/milestones`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ seasonId: selectedSeason.id, streakDays: 7, title: "New Milestone", icon: "🎁", rewardType: "coins", rewardAmount: 100, rewardLabel: "+100 Coins" }),
                    });
                    fetchDetail(selectedSeason, "milestones");
                  }}>+ Add Milestone</GradBtn>
                }>
                <p className="text-[11px] mb-4" style={{ color: "rgba(240,234,255,0.4)" }}>
                  Milestone rewards unlock when fans reach a specific login streak.
                </p>
                {loading ? (
                  <div className="flex flex-col gap-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(124,58,237,0.08)" }} />)}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {milestones.map((m) => (
                      <MilestoneEditor key={m.id} milestone={m}
                        seasonId={selectedSeason.id}
                        onSaved={() => fetchDetail(selectedSeason, "milestones")}
                        onDelete={handleDeleteMilestone}
                      />
                    ))}
                    {milestones.length === 0 && (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <span className="text-4xl">🏆</span>
                        <p style={{ color: "rgba(240,234,255,0.35)" }}>No milestones yet</p>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {/* ══ ANALYTICS TAB ══ */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-5">
            {!selectedSeason ? (
              <p style={{ color: "rgba(240,234,255,0.4)" }}>Select a season first.</p>
            ) : loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(124,58,237,0.08)" }} />
                ))}
              </div>
            ) : analytics ? (
              <SectionCard title={`Analytics — ${selectedSeason.name}`} icon="📊">
                <AnalyticsPanel analytics={analytics} />
              </SectionCard>
            ) : (
              <p style={{ color: "rgba(240,234,255,0.4)" }}>No analytics available yet.</p>
            )}
          </div>
        )}

      </div>

      {/* ── Reward modal ── */}
      {showRewardModal && selectedSeason && (
        <RewardModal
          reward={editReward}
          seasonId={selectedSeason.id}
          onSave={() => fetchDetail(selectedSeason, "rewards")}
          onClose={() => { setShowRewardModal(false); setEditReward(null); }}
        />
      )}
    </div>
  );
}