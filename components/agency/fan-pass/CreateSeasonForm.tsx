"use client";

import { useState, useCallback } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeasonFormData {
  name:          string;
  description:   string;
  startDate:     string;
  endDate:       string;
  vipPriceCents: number;
  vipPriceCoins: number;
  maxLevel:      number;
  xpPerLevel?:   number;
}

interface DraftTask {
  id:          string;
  icon:        string;
  label:       string;
  description: string;
  taskType:    string;
  xpReward:    number;
  coinReward:  number;
  isVipOnly:   boolean;
}

interface DraftReward {
  id:          string;
  level:       number;
  tier:        "free" | "vip";
  icon:        string;
  label:       string;
  rewardType:  string;
  rewardValue: string;
  rarity:      "common" | "rare" | "epic" | "legendary";
}

interface FeaturedCreator {
  userId:   string;
  name:     string;
  username: string;
  avatarUrl: string | null;
}

export interface CreateSeasonPayload extends SeasonFormData {
  tasks:            DraftTask[];
  freeRewards:      DraftReward[];
  vipRewards:       DraftReward[];
  featuredCreator:  FeaturedCreator | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-widest"
      style={{ color: MUTED }}>{children}</label>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", hint, step, min }: {
  label: string; value: any; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; step?: number; min?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <input type={type} value={value} placeholder={placeholder}
        step={step} min={min}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
      {hint && <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.35)" }}>{hint}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
        style={{ background: SURF, borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button onClick={() => onChange(!checked)}
        className="relative inline-flex items-center h-6 w-11 rounded-full shrink-0 mt-0.5 transition-all duration-200"
        style={{ background: checked ? GRAD : "rgba(124,58,237,0.15)" }}>
        <span className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }} />
      </button>
      <div>
        <p className="text-[12px] font-bold" style={{ color: TEXT }}>{label}</p>
        {description && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{description}</p>}
      </div>
    </div>
  );
}

function GradBtn({ children, onClick, disabled, variant = "primary", className = "" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "primary" | "ghost"; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black transition-all", className)}
      style={variant === "primary"
        ? { background: disabled ? "rgba(124,58,237,0.2)" : GRAD, color: "#fff", opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }
        : { background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, cursor: "pointer" }}>
      {children}
    </button>
  );
}

// ─── Step progress bar ────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Details",       icon: "📋" },
  { n: 2, label: "Free Rewards",  icon: "⭐" },
  { n: 3, label: "VIP Rewards",   icon: "💎" },
  { n: 4, label: "Tasks",         icon: "🎯" },
  { n: 5, label: "Review",        icon: "✅" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done   = current > step.n;
        const active = current === step.n;
        return (
          <div key={step.n} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="size-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all duration-300"
                style={{
                  background:  done ? "#22c55e" : active ? GRAD : "transparent",
                  borderColor: done ? "#22c55e" : active ? "transparent" : "rgba(124,58,237,0.25)",
                  color:       done || active ? "#fff" : "rgba(240,234,255,0.3)",
                  boxShadow:   active ? "0 0 14px rgba(124,58,237,0.4)" : "none",
                }}>
                {done ? "✓" : step.n}
              </div>
              <p className="text-[8px] font-black uppercase tracking-wider hidden sm:block whitespace-nowrap"
                style={{ color: active ? TEXT : done ? "#4ade80" : "rgba(240,234,255,0.3)" }}>
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500"
                style={{ background: done ? "#22c55e" : "rgba(124,58,237,0.15)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Default reward pools ─────────────────────────────────────────────────────

const FREE_REWARD_DEFAULTS: Omit<DraftReward, "id">[] = [
  { level: 1,  tier: "free", icon: "🖼️",  label: "Exclusive Photo",         rewardType: "exclusive_pic",    rewardValue: "1",    rarity: "common"    },
  { level: 2,  tier: "free", icon: "⚡",   label: "XP Boost (50)",           rewardType: "xp",               rewardValue: "50",   rarity: "common"    },
  { level: 3,  tier: "free", icon: "🎁",   label: "Low Tier Gift",           rewardType: "gift",             rewardValue: "low",  rarity: "common"    },
  { level: 4,  tier: "free", icon: "🎥",   label: "Short Exclusive Clip",    rewardType: "short_vid",        rewardValue: "1",    rarity: "rare"      },
  { level: 5,  tier: "free", icon: "🏅",   label: "Low Tier Badge",          rewardType: "badge",            rewardValue: "low",  rarity: "common"    },
  { level: 6,  tier: "free", icon: "🖼️",  label: "Exclusive Photo Pack",    rewardType: "exclusive_pic",    rewardValue: "3",    rarity: "rare"      },
  { level: 7,  tier: "free", icon: "💰",   label: "Coin Reward (200)",       rewardType: "coins",            rewardValue: "200",  rarity: "common"    },
  { level: 8,  tier: "free", icon: "📦",   label: "Low Tier Mystery Box",    rewardType: "mystery_box_low",  rewardValue: "1",    rarity: "rare"      },
  { level: 9,  tier: "free", icon: "⚡",   label: "XP Boost (150)",          rewardType: "xp",               rewardValue: "150",  rarity: "rare"      },
  { level: 10, tier: "free", icon: "🏆",   label: "Rare Badge",              rewardType: "badge",            rewardValue: "rare", rarity: "epic"      },
];

const VIP_REWARD_DEFAULTS: Omit<DraftReward, "id">[] = [
  { level: 1,  tier: "vip", icon: "🖼️",  label: "VIP Exclusive Photo",      rewardType: "exclusive_pic",    rewardValue: "1",         rarity: "rare"      },
  { level: 2,  tier: "vip", icon: "📦",   label: "High Tier Mystery Box",    rewardType: "mystery_box_high", rewardValue: "1",         rarity: "epic"      },
  { level: 3,  tier: "vip", icon: "🎥",   label: "Long Exclusive Video",     rewardType: "long_vid",         rewardValue: "1",         rarity: "epic"      },
  { level: 4,  tier: "vip", icon: "⚡",   label: "XP Boost (500)",           rewardType: "xp",               rewardValue: "500",       rarity: "epic"      },
  { level: 5,  tier: "vip", icon: "💎",   label: "Epic Badge",               rewardType: "badge",            rewardValue: "epic",      rarity: "epic"      },
  { level: 6,  tier: "vip", icon: "🖼️",  label: "Exclusive Photo Bundle",   rewardType: "exclusive_pic",    rewardValue: "5",         rarity: "epic"      },
  { level: 7,  tier: "vip", icon: "🎁",   label: "High Tier Gift",           rewardType: "gift",             rewardValue: "high",      rarity: "legendary" },
  { level: 8,  tier: "vip", icon: "🎥",   label: "Creator Long Vid Pack",    rewardType: "long_vid",         rewardValue: "3",         rarity: "legendary" },
  { level: 9,  tier: "vip", icon: "🌟",   label: "Featured Creator Access",  rewardType: "featured_access",  rewardValue: "exclusive", rarity: "legendary" },
  { level: 10, tier: "vip", icon: "🔑",   label: "1 Month Sub to Creator",   rewardType: "creator_sub",      rewardValue: "1_month",   rarity: "legendary" },
];

// ─── Rarity config ────────────────────────────────────────────────────────────

const RARITIES = [
  { value: "common",    label: "Common",    color: "#94a3b8" },
  { value: "rare",      label: "Rare",      color: "#38bdf8" },
  { value: "epic",      label: "Epic",      color: "#a78bfa" },
  { value: "legendary", label: "Legendary", color: "#fbbf24" },
];

const REWARD_TYPES = [
  { value: "exclusive_pic",    label: "Exclusive Photo"        },
  { value: "short_vid",        label: "Short Exclusive Video"  },
  { value: "long_vid",         label: "Long Exclusive Video"   },
  { value: "xp",               label: "XP Boost"               },
  { value: "coins",            label: "Coins"                  },
  { value: "badge",            label: "Badge"                  },
  { value: "gift",             label: "Gift"                   },
  { value: "mystery_box_low",  label: "Mystery Box (Low)"      },
  { value: "mystery_box_high", label: "Mystery Box (High)"     },
  { value: "featured_access",  label: "Featured Creator Access"},
  { value: "creator_sub",      label: "Creator Subscription"   },
];

const REWARD_ICONS = ["🖼️","🎥","⚡","💰","🏅","🎁","📦","💎","🌟","🔑","🏆","🎯","✨","👑","🔥"];
const TASK_ICONS   = ["📸","💬","❤️","🔁","⭐","🎯","🔥","💎","🎁","📢","🎵","🎮","📚","💪","✨"];
const TASK_TYPES   = [
  { value: "daily_login",   label: "Daily Login"          },
  { value: "like_post",     label: "Like a Post"          },
  { value: "comment_post",  label: "Comment on Post"      },
  { value: "share_post",    label: "Share a Post"         },
  { value: "subscribe",     label: "Subscribe to Creator" },
  { value: "send_message",  label: "Send a Message"       },
  { value: "custom",        label: "Custom Task"          },
];

// ─── Reward row ───────────────────────────────────────────────────────────────

function RewardRow({ reward, onEdit, onDelete }: {
  reward: DraftReward; onEdit: () => void; onDelete: () => void;
}) {
  const rarity = RARITIES.find((r) => r.value === reward.rarity);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border group"
      style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
      <span className="text-[16px] flex-shrink-0">{reward.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-black truncate" style={{ color: TEXT }}>
            Lv.{reward.level} · {reward.label}
          </p>
          <span className="text-[8px] font-black rounded-full px-1.5 py-0.5 flex-shrink-0"
            style={{ background: `${rarity?.color}18`, color: rarity?.color, border: `1px solid ${rarity?.color}30` }}>
            {reward.rarity}
          </span>
        </div>
        <p className="text-[10px]" style={{ color: MUTED }}>{reward.rewardType} · {reward.rewardValue}</p>
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit}
          className="size-7 rounded-lg flex items-center justify-center text-[11px]"
          style={{ background: "rgba(124,58,237,0.15)", color: V }}>✏️</button>
        <button onClick={onDelete}
          className="size-7 rounded-lg flex items-center justify-center text-[11px]"
          style={{ background: "rgba(239,57,118,0.12)", color: P }}>✕</button>
      </div>
    </div>
  );
}

// ─── Reward edit modal ────────────────────────────────────────────────────────

function RewardModal({ reward, tier, onSave, onCancel }: {
  reward: DraftReward | null; tier: "free" | "vip";
  onSave: (r: DraftReward) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<DraftReward>(reward ?? {
    id: uid(), level: 1, tier, icon: tier === "vip" ? "💎" : "⭐",
    label: "", rewardType: "xp", rewardValue: "50", rarity: tier === "vip" ? "epic" : "common",
  });
  const set = (k: keyof DraftReward) => (v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-md rounded-[20px] border p-5 flex flex-col gap-4"
        style={{ background: CARD, borderColor: BORDER, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>

        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-black" style={{ color: TEXT }}>
            {reward ? "Edit" : "Add"} {tier === "vip" ? "VIP" : "Free"} Reward
          </h3>
          <button onClick={onCancel} style={{ color: MUTED, background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>

        {/* Icon picker */}
        <div className="flex flex-col gap-1.5">
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-1.5">
            {REWARD_ICONS.map((ic) => (
              <button key={ic} onClick={() => set("icon")(ic)}
                className="size-9 rounded-xl flex items-center justify-center text-[16px] transition-all"
                style={{
                  background: form.icon === ic ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${form.icon === ic ? V : BORDER}`,
                }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Level" value={form.level} onChange={(v) => set("level")(Number(v))} type="number" min={1} />
          <Select label="Rarity" value={form.rarity}
            onChange={set("rarity")}
            options={RARITIES.map((r) => ({ value: r.value, label: r.label }))} />
        </div>

        <Input label="Reward Label" value={form.label} onChange={set("label")} placeholder="e.g. Exclusive Photo Pack" />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Reward Type" value={form.rewardType} onChange={set("rewardType")} options={REWARD_TYPES} />
          <Input label="Value / Qty" value={form.rewardValue} onChange={set("rewardValue")} placeholder="e.g. 1, 500, high" />
        </div>

        <div className="flex gap-3 pt-1">
          <GradBtn variant="ghost" onClick={onCancel} className="flex-1">Cancel</GradBtn>
          <GradBtn onClick={() => { if (form.label.trim()) onSave(form); }}
            disabled={!form.label.trim()} className="flex-[2]">
            {reward ? "Save Changes" : "Add Reward"}
          </GradBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onEdit, onDelete }: {
  task: DraftTask; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border group"
      style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
      <span className="text-[16px] flex-shrink-0">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black truncate" style={{ color: TEXT }}>{task.label}</p>
        <p className="text-[10px]" style={{ color: MUTED }}>
          +{task.xpReward} XP · +{task.coinReward} coins
          {task.isVipOnly && <span className="ml-2 font-bold" style={{ color: "#fbbf24" }}>VIP only</span>}
        </p>
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit}
          className="size-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)", color: V }}>✏️</button>
        <button onClick={onDelete}
          className="size-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(239,57,118,0.12)", color: P }}>✕</button>
      </div>
    </div>
  );
}

// ─── Task edit modal ──────────────────────────────────────────────────────────

function TaskModal({ task, onSave, onCancel }: {
  task: DraftTask | null; onSave: (t: DraftTask) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<DraftTask>(task ?? {
    id: uid(), icon: "🎯", label: "", description: "",
    taskType: "daily_login", xpReward: 50, coinReward: 10, isVipOnly: false,
  });
  const set = (k: keyof DraftTask) => (v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-md rounded-[20px] border p-5 flex flex-col gap-4"
        style={{ background: CARD, borderColor: BORDER, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>

        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-black" style={{ color: TEXT }}>{task ? "Edit" : "New"} Task</h3>
          <button onClick={onCancel} style={{ color: MUTED, background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-1.5">
            {TASK_ICONS.map((ic) => (
              <button key={ic} onClick={() => set("icon")(ic)}
                className="size-9 rounded-xl flex items-center justify-center text-[16px] transition-all"
                style={{
                  background: form.icon === ic ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${form.icon === ic ? V : BORDER}`,
                }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <Select label="Task Type" value={form.taskType} onChange={set("taskType")} options={TASK_TYPES} />
        <Input label="Task Label" value={form.label} onChange={set("label")} placeholder="Like 3 posts today" />
        <Input label="Description" value={form.description} onChange={set("description")} placeholder="Optional description…" />

        <div className="grid grid-cols-2 gap-3">
          <Input label="XP Reward" value={form.xpReward} onChange={(v) => set("xpReward")(Number(v))} type="number" min={0} />
          <Input label="Coin Reward" value={form.coinReward} onChange={(v) => set("coinReward")(Number(v))} type="number" min={0} />
        </div>

        <Toggle checked={form.isVipOnly} onChange={(v) => set("isVipOnly")(v)}
          label="VIP Only" description="Only VIP subscribers can complete this task" />

        <div className="flex gap-3 pt-1">
          <GradBtn variant="ghost" onClick={onCancel} className="flex-1">Cancel</GradBtn>
          <GradBtn onClick={() => { if (form.label.trim()) onSave(form); }}
            disabled={!form.label.trim()} className="flex-[2]">
            {task ? "Save Changes" : "Add Task"}
          </GradBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Featured creator search ──────────────────────────────────────────────────

function FeaturedCreatorPicker({ selected, onSelect }: {
  selected: FeaturedCreator | null;
  onSelect: (c: FeaturedCreator | null) => void;
}) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<FeaturedCreator[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/agency/creators/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.creators ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {selected ? (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.3)" }}>
          <div className="size-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white"
            style={{ background: selected.avatarUrl ? "transparent" : GRAD }}>
            {selected.avatarUrl
              ? <img src={selected.avatarUrl} className="size-full object-cover" alt="" />
              : selected.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black" style={{ color: TEXT }}>{selected.name}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>@{selected.username}</p>
          </div>
          <button onClick={() => onSelect(null)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg border"
            style={{ borderColor: "rgba(239,57,118,0.3)", color: P, background: "none", cursor: "pointer" }}>
            Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <input type="text" value={query}
              onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
              placeholder="Search creators by name or username…"
              className="w-full rounded-xl border px-4 py-2.5 text-[13px] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
            {loading && (
              <svg className="animate-spin size-4 absolute right-3 top-1/2 -translate-y-1/2"
                viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke={MUTED} strokeWidth="4"/>
                <path className="opacity-75" fill={V} d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
          </div>

          {results.length > 0 && (
            <div className="flex flex-col gap-1 rounded-xl border overflow-hidden"
              style={{ background: SURF, borderColor: BORDER }}>
              {results.map((c) => (
                <button key={c.userId} onClick={() => { onSelect(c); setQuery(""); setResults([]); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:opacity-80"
                  style={{ background: "transparent" }}>
                  <div className="size-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[11px]"
                    style={{ background: c.avatarUrl ? "transparent" : GRAD }}>
                    {c.avatarUrl
                      ? <img src={c.avatarUrl} className="size-full object-cover" alt="" />
                      : c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[12px] font-black" style={{ color: TEXT }}>{c.name}</p>
                    <p className="text-[10px]" style={{ color: MUTED }}>@{c.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COUNTRIES (for reference — not used here) ────────────────────────────────

const COUNTRIES = ["United States","United Kingdom","Canada","Australia","Jamaica","Nigeria","Other"]
  .map((c) => ({ value: c, label: c }));

// ─── MAIN CREATE SEASON FORM ──────────────────────────────────────────────────

interface CreateSeasonFormProps {
  onCreate:  (data: CreateSeasonPayload) => Promise<void>;
  onCancel:  () => void;
}

export function CreateSeasonForm({ onCreate, onCancel }: CreateSeasonFormProps) {
  const [step,    setStep]   = useState(1);
  const [saving,  setSaving] = useState(false);

  // Step 1 — season details
  const [form, setForm] = useState<SeasonFormData>({
    name: "", description: "", startDate: "", endDate: "",
    vipPriceCents: 999, vipPriceCoins: 5000, maxLevel: 100, xpPerLevel: 150,
  });
  const setField = (k: keyof SeasonFormData) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Step 2 — free rewards
  const [freeRewards, setFreeRewards] = useState<DraftReward[]>(
    FREE_REWARD_DEFAULTS.map((r) => ({ ...r, id: uid() }))
  );
  const [editingFree, setEditingFree]   = useState<DraftReward | null>(null);
  const [addingFree,  setAddingFree]    = useState(false);

  // Step 3 — VIP rewards + featured creator
  const [vipRewards, setVipRewards] = useState<DraftReward[]>(
    VIP_REWARD_DEFAULTS.map((r) => ({ ...r, id: uid() }))
  );
  const [editingVip,       setEditingVip]       = useState<DraftReward | null>(null);
  const [addingVip,        setAddingVip]         = useState(false);
  const [featuredCreator,  setFeaturedCreator]   = useState<FeaturedCreator | null>(null);
  const [enableFeatured,   setEnableFeatured]    = useState(false);

  // Step 4 — tasks
  const [tasks,       setTasks]       = useState<DraftTask[]>([
    { id: uid(), icon: "📸", label: "Post a photo",     description: "", taskType: "daily_login",  xpReward: 50,  coinReward: 10,  isVipOnly: false },
    { id: uid(), icon: "❤️",  label: "Like 3 posts",    description: "", taskType: "like_post",    xpReward: 30,  coinReward: 5,   isVipOnly: false },
    { id: uid(), icon: "💬",  label: "Leave a comment", description: "", taskType: "comment_post", xpReward: 40,  coinReward: 8,   isVipOnly: false },
    { id: uid(), icon: "💎",  label: "VIP Daily Login",  description: "Exclusive VIP task", taskType: "daily_login", xpReward: 120, coinReward: 25, isVipOnly: true },
  ]);
  const [editingTask, setEditingTask] = useState<DraftTask | null>(null);
  const [addingTask,  setAddingTask]  = useState(false);

  const step1Valid = form.name.trim() && form.startDate && form.endDate
    && new Date(form.endDate) > new Date(form.startDate);

  const handleSubmit = async () => {
    setSaving(true);
    await onCreate({
      ...form,
      freeRewards,
      vipRewards,
      tasks,
      featuredCreator: enableFeatured ? featuredCreator : null,
    });
    setSaving(false);
  };

  // ── Reward helpers ──
  const saveReward = (tier: "free" | "vip", r: DraftReward, isNew: boolean) => {
    if (tier === "free") {
      setFreeRewards((p) => isNew ? [...p, r] : p.map((x) => x.id === r.id ? r : x));
      setEditingFree(null); setAddingFree(false);
    } else {
      setVipRewards((p) => isNew ? [...p, r] : p.map((x) => x.id === r.id ? r : x));
      setEditingVip(null); setAddingVip(false);
    }
  };
  const deleteReward = (tier: "free" | "vip", id: string) => {
    if (tier === "free") setFreeRewards((p) => p.filter((r) => r.id !== id));
    else                 setVipRewards ((p) => p.filter((r) => r.id !== id));
  };

  // ── Task helpers ──
  const saveTask = (t: DraftTask, isNew: boolean) => {
    setTasks((p) => isNew ? [...p, t] : p.map((x) => x.id === t.id ? t : x));
    setEditingTask(null); setAddingTask(false);
  };

  return (
    <>
      <div className="rounded-[20px] border overflow-hidden"
        style={{ background: CARD, borderColor: "rgba(124,58,237,0.25)", boxShadow: "0 0 40px rgba(124,58,237,0.08)" }}>

        {/* Step header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(124,58,237,0.12)", background: SURF }}>
          <StepBar current={step} />
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* ════════════════════════════════════════════════════════════════════
              STEP 1 — Season details
          ════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Season Details</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  Basic info for this Fan Pass season
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Input label="Season Name *" value={form.name}
                  onChange={setField("name")} placeholder="Season 2 — Summer 2026" />

                <div className="flex flex-col gap-1.5">
                  <Label>Description</Label>
                  <textarea value={form.description}
                    onChange={(e) => setField("description")(e.target.value)}
                    placeholder="Brief description for fans…" rows={2}
                    className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date *" value={form.startDate} onChange={setField("startDate")} type="date" />
                  <Input label="End Date *"   value={form.endDate}   onChange={setField("endDate")}   type="date" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="VIP Price ($)" value={(form.vipPriceCents / 100).toFixed(2)}
                    onChange={(v) => setForm((p) => ({ ...p, vipPriceCents: Math.round(Number(v) * 100) }))}
                    type="number" step={0.01} min={0} />
                  <Input label="VIP Price (coins)" value={form.vipPriceCoins}
                    onChange={(v) => setForm((p) => ({ ...p, vipPriceCoins: Number(v) }))}
                    type="number" min={0} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Max Level" value={form.maxLevel}
                    onChange={(v) => setForm((p) => ({ ...p, maxLevel: Number(v) }))}
                    type="number" min={1} />
                  <Input label="XP Per Level" value={form.xpPerLevel ?? 150}
                    onChange={(v) => setForm((p) => ({ ...p, xpPerLevel: Number(v) }))}
                    type="number" min={1} />
                </div>
              </div>

              {form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate) && (
                <p className="text-[11px] font-bold" style={{ color: P }}>⚠️ End date must be after start date</p>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              STEP 2 — Free tier rewards
          ════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Free Tier Rewards</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  What free-tier fans unlock at each level
                </p>
              </div>

              {/* Free reward legend */}
              <div className="rounded-xl border px-4 py-3 flex flex-col gap-1.5"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>
                  Free Tier Includes
                </p>
                {["Exclusive Photos", "Short Exclusive Videos", "Low Tier Badges & Gifts",
                  "XP Boosts", "Low Tier Mystery Boxes", "Coins"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: "#38bdf8" }} />
                    <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.7)" }}>{item}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {freeRewards
                  .sort((a, b) => a.level - b.level)
                  .map((r) => (
                    <RewardRow key={r.id} reward={r}
                      onEdit={() => { setEditingFree(r); setAddingFree(false); }}
                      onDelete={() => deleteReward("free", r.id)} />
                  ))}
              </div>

              <button onClick={() => { setEditingFree(null); setAddingFree(true); }}
                className="w-full py-2.5 rounded-xl text-[12px] font-black border transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)", color: "#a78bfa", borderStyle: "dashed" }}>
                + Add Free Reward
              </button>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              STEP 3 — VIP rewards + featured creator
          ════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>VIP Tier Rewards</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  Premium rewards for VIP subscribers
                </p>
              </div>

              {/* VIP reward legend */}
              <div className="rounded-xl border px-4 py-3 flex flex-col gap-1.5"
                style={{ background: "rgba(251,191,36,0.05)", borderColor: "rgba(251,191,36,0.2)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#fbbf24" }}>
                  💎 VIP Tier Includes
                </p>
                {["High Tier Mystery Boxes", "Long Exclusive Videos", "Exclusive Photo Bundles",
                  "Epic & Legendary Badges", "High Tier Gifts", "Large XP Boosts",
                  "Featured Creator Access", "1 Month Creator Subscription"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: "#fbbf24" }} />
                    <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.7)" }}>{item}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {vipRewards
                  .sort((a, b) => a.level - b.level)
                  .map((r) => (
                    <RewardRow key={r.id} reward={r}
                      onEdit={() => { setEditingVip(r); setAddingVip(false); }}
                      onDelete={() => deleteReward("vip", r.id)} />
                  ))}
              </div>

              <button onClick={() => { setEditingVip(null); setAddingVip(true); }}
                className="w-full py-2.5 rounded-xl text-[12px] font-black border transition-all hover:opacity-80"
                style={{ background: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24", borderStyle: "dashed" }}>
                + Add VIP Reward
              </button>

              {/* Featured creator */}
              <div className="pt-2 border-t" style={{ borderColor: BORDER }}>
                <Toggle
                  checked={enableFeatured}
                  onChange={setEnableFeatured}
                  label="Feature a Creator in this VIP Pass"
                  description="Completing the VIP pass gifts fans 1 month sub to the featured creator, plus their exclusive content as rewards"
                />

                {enableFeatured && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="rounded-xl border px-4 py-3"
                      style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
                      <p className="text-[11px]" style={{ color: MUTED }}>
                        🌟 The featured creator's exclusive photos, videos and content will be used as VIP rewards.
                        Fans who complete the full VIP pass will receive a free 1-month subscription to this creator.
                      </p>
                    </div>
                    <Label>Select Featured Creator</Label>
                    <FeaturedCreatorPicker
                      selected={featuredCreator}
                      onSelect={setFeaturedCreator}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              STEP 4 — Tasks (free + VIP)
          ════════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Fan Pass Tasks</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  Weekly tasks fans complete to earn XP and coins
                </p>
              </div>

              {/* Free tasks */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: MUTED }}>
                  Free Tasks ({tasks.filter((t) => !t.isVipOnly).length})
                </p>
                <div className="flex flex-col gap-2">
                  {tasks.filter((t) => !t.isVipOnly).map((t) => (
                    <TaskRow key={t.id} task={t}
                      onEdit={() => { setEditingTask(t); setAddingTask(false); }}
                      onDelete={() => setTasks((p) => p.filter((x) => x.id !== t.id))} />
                  ))}
                </div>
              </div>

              {/* VIP tasks */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#fbbf24" }}>
                  💎 VIP Tasks ({tasks.filter((t) => t.isVipOnly).length})
                </p>
                <div className="flex flex-col gap-2">
                  {tasks.filter((t) => t.isVipOnly).map((t) => (
                    <TaskRow key={t.id} task={t}
                      onEdit={() => { setEditingTask(t); setAddingTask(false); }}
                      onDelete={() => setTasks((p) => p.filter((x) => x.id !== t.id))} />
                  ))}
                  {tasks.filter((t) => t.isVipOnly).length === 0 && (
                    <p className="text-[11px] text-center py-3" style={{ color: MUTED }}>
                      No VIP tasks yet — add one below
                    </p>
                  )}
                </div>
              </div>

              <button onClick={() => { setEditingTask(null); setAddingTask(true); }}
                className="w-full py-2.5 rounded-xl text-[12px] font-black border transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)", color: "#a78bfa", borderStyle: "dashed" }}>
                + Add Task
              </button>

              <div className="rounded-xl border px-4 py-3 flex items-start gap-2"
                style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
                <span className="text-[13px] flex-shrink-0">💡</span>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  Tasks reset weekly. Default 7-day login bonus and streak milestones are added automatically.
                </p>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              STEP 5 — Review
          ════════════════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Review & Create</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  Everything look good? Season will be created as a draft.
                </p>
              </div>

              {/* Season summary */}
              <div className="rounded-xl border p-4 flex flex-col gap-3"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Season</p>
                <p className="text-[15px] font-black" style={{ color: TEXT }}>{form.name}</p>
                {form.description && <p className="text-[12px]" style={{ color: MUTED }}>{form.description}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                  {[
                    { label: "Start",     value: form.startDate },
                    { label: "End",       value: form.endDate },
                    { label: "VIP",       value: `$${(form.vipPriceCents / 100).toFixed(2)}/mo` },
                    { label: "Max Level", value: String(form.maxLevel) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.3)" }}>{label}</p>
                      <p className="text-[12px] font-bold" style={{ color: TEXT }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: MUTED }}>
                    ⭐ Free Rewards
                  </p>
                  <p className="text-[20px] font-black" style={{ color: TEXT }}>{freeRewards.length}</p>
                  <p className="text-[10px]" style={{ color: MUTED }}>levels configured</p>
                </div>
                <div className="rounded-xl border p-3"
                  style={{ background: "rgba(251,191,36,0.05)", borderColor: "rgba(251,191,36,0.2)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#fbbf24" }}>
                    💎 VIP Rewards
                  </p>
                  <p className="text-[20px] font-black" style={{ color: TEXT }}>{vipRewards.length}</p>
                  <p className="text-[10px]" style={{ color: MUTED }}>levels configured</p>
                </div>
              </div>

              {/* Featured creator */}
              {enableFeatured && featuredCreator && (
                <div className="rounded-xl border px-4 py-3 flex items-center gap-3"
                  style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.3)" }}>
                  <span className="text-[18px]">🌟</span>
                  <div>
                    <p className="text-[12px] font-black" style={{ color: TEXT }}>
                      Featured: {featuredCreator.name}
                    </p>
                    <p className="text-[10px]" style={{ color: MUTED }}>
                      VIP completers get 1 month free sub
                    </p>
                  </div>
                </div>
              )}

              {/* Tasks summary */}
              <div className="rounded-xl border p-3"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: MUTED }}>
                  Tasks ({tasks.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {tasks.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span className="text-[11px] flex-1" style={{ color: TEXT }}>{t.label}</span>
                      <span className="text-[10px]" style={{ color: MUTED }}>+{t.xpReward} XP</span>
                      {t.isVipOnly && (
                        <span className="text-[8px] font-black rounded-full px-1.5 py-0.5"
                          style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>VIP</span>
                      )}
                    </div>
                  ))}
                  {tasks.length > 5 && (
                    <p className="text-[10px]" style={{ color: MUTED }}>+{tasks.length - 5} more tasks</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Nav buttons ── */}
          <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: BORDER }}>
            {step === 1 ? (
              <GradBtn variant="ghost" onClick={onCancel} className="flex-1">Cancel</GradBtn>
            ) : (
              <GradBtn variant="ghost" onClick={() => setStep((s) => s - 1)} className="flex-1">← Back</GradBtn>
            )}

            <div className="flex-shrink-0 text-[10px] font-bold" style={{ color: MUTED }}>
              Step {step} of {STEPS.length}
            </div>

            {step < STEPS.length ? (
              <GradBtn
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !step1Valid}
                className="flex-1">
                Continue →
              </GradBtn>
            ) : (
              <GradBtn onClick={handleSubmit} disabled={saving} className="flex-1">
                {saving ? (
                  <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Creating…</>
                ) : "🚀 Create Season"}
              </GradBtn>
            )}
          </div>
        </div>
      </div>

      {/* ── Reward modals ── */}
      {(addingFree || editingFree) && (
        <RewardModal
          tier="free"
          reward={addingFree ? null : editingFree}
          onSave={(r) => saveReward("free", r, addingFree)}
          onCancel={() => { setEditingFree(null); setAddingFree(false); }}
        />
      )}
      {(addingVip || editingVip) && (
        <RewardModal
          tier="vip"
          reward={addingVip ? null : editingVip}
          onSave={(r) => saveReward("vip", r, addingVip)}
          onCancel={() => { setEditingVip(null); setAddingVip(false); }}
        />
      )}

      {/* ── Task modal ── */}
      {(addingTask || editingTask) && (
        <TaskModal
          task={addingTask ? null : editingTask}
          onSave={(t) => saveTask(t, addingTask)}
          onCancel={() => { setEditingTask(null); setAddingTask(false); }}
        />
      )}
    </>
  );
}