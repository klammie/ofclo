"use client";

import { useState, useCallback, useEffect } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD = "#1a1635";
const SURF = "#13112b";
const BORDER = "rgba(124,58,237,0.2)";
const TEXT = "#f0eaff";
const MUTED = "rgba(240,234,255,0.5)";

// ─── Types ────────────────────────────────────────────────────────────────────

type PassTier    = "free" | "premium";
type TaskType    = "weekly" | "streak";
type RewardType  = "coins" | "xp" | "badge" | "booster_xp" | "booster_coin" | "streak_freeze" | "mystery_box" | "emote" | "vip_pass";
type RewardTier  = "free" | "vip";
type Rarity      = "common" | "rare" | "epic" | "legendary";

interface Task {
  id?: number;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  tier: PassTier;
  type: TaskType;
  isActive: boolean;
}

interface RewardRow {
  id?: number;
  level: number;
  tier: RewardTier;
  rewardType: RewardType;
  icon: string;
  label: string;
  description: string;
  rewardAmount: number;
  isVipOnly: boolean;
  rarity: Rarity;
}

interface Season {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  xpPerLevel: number;
  maxLevel: number;
  vipPriceCents: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string; icon: string }[] = [
  { value: "coins",         label: "Coins",         icon: "🪙" },
  { value: "xp",            label: "Bonus XP",      icon: "⚡" },
  { value: "badge",         label: "Badge",         icon: "🏅" },
  { value: "booster_xp",   label: "XP Booster",    icon: "🔥" },
  { value: "booster_coin",  label: "Coin Booster",  icon: "💰" },
  { value: "streak_freeze", label: "Streak Freeze", icon: "🧊" },
  { value: "mystery_box",   label: "Mystery Box",   icon: "🎁" },
  { value: "emote",         label: "Emote",         icon: "😄" },
  { value: "vip_pass",      label: "VIP Pass",      icon: "💎" },
];

const RARITY_OPTIONS: { value: Rarity; color: string }[] = [
  { value: "common",    color: "#94a3b8" },
  { value: "rare",      color: "#38bdf8" },
  { value: "epic",      color: "#a78bfa" },
  { value: "legendary", color: "#fbbf24" },
];

const DEFAULT_FREE_TASKS: Omit<Task, "id">[] = [
  { title: "Like 5 posts",            description: "Like any 5 posts from creators you follow.", icon: "❤️", xpReward: 30,  coinReward: 0,  tier: "free",    type: "weekly", isActive: true },
  { title: "Comment on a post",       description: "Leave a thoughtful comment on a creator's post.", icon: "💬", xpReward: 40,  coinReward: 0,  tier: "free",    type: "weekly", isActive: true },
  { title: "Watch a full video",      description: "Watch any creator video to completion.", icon: "🎬", xpReward: 50,  coinReward: 10, tier: "free",    type: "weekly", isActive: true },
  { title: "Share a post",            description: "Share a creator's post to your profile.", icon: "📤", xpReward: 35,  coinReward: 0,  tier: "free",    type: "weekly", isActive: true },
  { title: "Send a gift",             description: "Send any gift to a creator.", icon: "🎁", xpReward: 60,  coinReward: 0,  tier: "free",    type: "weekly", isActive: true },
  { title: "Visit 3 creator pages",   description: "Browse 3 different creator profiles.", icon: "🔍", xpReward: 25,  coinReward: 5,  tier: "free",    type: "weekly", isActive: true },
  { title: "Complete your profile",   description: "Fill in your bio and add a profile photo.", icon: "👤", xpReward: 45,  coinReward: 20, tier: "free",    type: "weekly", isActive: true },
];

const DEFAULT_PREMIUM_TASKS: Omit<Task, "id">[] = [
  { title: "Subscribe to a creator",  description: "Subscribe to any creator you haven't subscribed to.", icon: "⭐", xpReward: 150, coinReward: 50, tier: "premium", type: "weekly", isActive: true },
  { title: "Tip a creator",           description: "Send a tip of any amount to a creator.", icon: "💝", xpReward: 120, coinReward: 30, tier: "premium", type: "weekly", isActive: true },
  { title: "Unlock a PPV post",       description: "Purchase any pay-per-view exclusive content.", icon: "🔓", xpReward: 200, coinReward: 75, tier: "premium", type: "weekly", isActive: true },
  { title: "Send 5 messages",         description: "Send at least 5 messages to creators.", icon: "💬", xpReward: 100, coinReward: 25, tier: "premium", type: "weekly", isActive: true },
  { title: "React to 10 posts",       description: "React to 10 posts using any emoji reaction.", icon: "🎉", xpReward: 80,  coinReward: 20, tier: "premium", type: "weekly", isActive: true },
  { title: "Complete a quest chain",  description: "Finish all 3 daily quests in a single day.", icon: "🏆", xpReward: 180, coinReward: 60, tier: "premium", type: "weekly", isActive: true },
];

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>{children}</label>;
}

function Input({ value, onChange, placeholder = "", type = "text" }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border px-3 py-2 text-[12px] outline-none"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border px-3 py-2 text-[12px] outline-none"
      style={{ background: SURF, borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function GradBtn({ children, onClick, disabled, variant = "primary", size = "sm" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md";
}) {
  const styles = {
    primary: { background: GRAD, color: "#fff", border: "none" },
    ghost:   { background: "rgba(124,58,237,0.08)", color: MUTED, border: `1px solid ${BORDER}` },
    danger:  { background: "rgba(239,57,118,0.1)",  color: P,     border: "1px solid rgba(239,57,118,0.3)" },
  };
  const sizes = { sm: "px-3 py-1.5 text-[11px]", md: "px-5 py-2.5 text-[12px]" };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-xl font-black transition-all flex items-center gap-1.5 ${sizes[size]}`}
      style={{ ...styles[variant] as any, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative inline-flex items-center h-5 w-9 rounded-full transition-all"
      style={{ background: checked ? GRAD : "rgba(124,58,237,0.15)", border: `1px solid ${checked ? "transparent" : BORDER}` }}>
      <span className="inline-block size-3.5 rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, index, onChange, onDelete }: {
  task: Task; index: number; onChange: (t: Task) => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[14px] border overflow-hidden"
      style={{ background: CARD, borderColor: task.isActive ? BORDER : "rgba(124,58,237,0.08)" }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-[18px] flex-shrink-0">{task.icon || "⭐"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black truncate" style={{ color: TEXT }}>{task.title || "Untitled task"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
              style={{ background: task.tier === "premium" ? "rgba(251,191,36,0.15)" : "rgba(124,58,237,0.12)", color: task.tier === "premium" ? "#fbbf24" : V }}>
              {task.tier}
            </span>
            <span className="text-[9px] font-bold" style={{ color: MUTED }}>+{task.xpReward} XP</span>
            {task.coinReward > 0 && <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>+{task.coinReward} 🪙</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Toggle checked={task.isActive} onChange={(v) => onChange({ ...task, isActive: v })} />
          <button onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-bold" style={{ color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
            {expanded ? "▲" : "▼"}
          </button>
          <button onClick={onDelete} className="text-[11px]" style={{ color: P, background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-3"
          style={{ borderColor: "rgba(124,58,237,0.08)", background: "rgba(124,58,237,0.03)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1"><Label>Icon (emoji)</Label><Input value={task.icon} onChange={(v) => onChange({ ...task, icon: v })} placeholder="⭐" /></div>
            <div className="flex flex-col gap-1"><Label>Tier</Label>
              <Select value={task.tier} onChange={(v) => onChange({ ...task, tier: v as PassTier })}
                options={[{ value: "free", label: "Free" }, { value: "premium", label: "Premium" }]} />
            </div>
          </div>
          <div className="flex flex-col gap-1"><Label>Title</Label><Input value={task.title} onChange={(v) => onChange({ ...task, title: v })} placeholder="Task title" /></div>
          <div className="flex flex-col gap-1"><Label>Description</Label><Input value={task.description} onChange={(v) => onChange({ ...task, description: v })} placeholder="What the user needs to do" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1"><Label>XP Reward</Label><Input type="number" value={task.xpReward} onChange={(v) => onChange({ ...task, xpReward: parseInt(v) || 0 })} /></div>
            <div className="flex flex-col gap-1"><Label>Coin Reward</Label><Input type="number" value={task.coinReward} onChange={(v) => onChange({ ...task, coinReward: parseInt(v) || 0 })} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reward row ───────────────────────────────────────────────────────────────

function RewardRow({ reward, onChange, onDelete }: {
  reward: RewardRow; onChange: (r: RewardRow) => void; onDelete: () => void;
}) {
  const rOpt = REWARD_TYPE_OPTIONS.find((o) => o.value === reward.rewardType);
  const rarityColor = RARITY_OPTIONS.find((r) => r.value === reward.rarity)?.color ?? "#94a3b8";
  const isLastLevel = reward.level >= 48; // treat last few levels as mystery box territory

  return (
    <div className="flex items-center gap-3 rounded-[14px] border px-4 py-3 group"
      style={{ background: CARD, borderColor: reward.tier === "vip" ? "rgba(251,191,36,0.3)" : BORDER }}>
      {/* Level pill */}
      <div className="size-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
        style={{ background: GRAD, color: "#fff" }}>
        {reward.level}
      </div>

      {/* Icon */}
      <input value={reward.icon} onChange={(e) => onChange({ ...reward, icon: e.target.value })}
        className="w-10 text-center rounded-lg border py-1 text-[16px] bg-transparent outline-none"
        style={{ borderColor: BORDER, color: TEXT }} />

      {/* Label */}
      <input value={reward.label} onChange={(e) => onChange({ ...reward, label: e.target.value })}
        className="flex-1 rounded-xl border px-2.5 py-1.5 text-[12px] outline-none bg-transparent"
        style={{ borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}
        placeholder="Reward label" />

      {/* Type selector */}
      <select value={reward.rewardType} onChange={(e) => onChange({ ...reward, rewardType: e.target.value as RewardType })}
        className="rounded-xl border px-2 py-1.5 text-[11px] outline-none"
        style={{ background: SURF, borderColor: BORDER, color: TEXT, fontFamily: "inherit", minWidth: 100 }}>
        {REWARD_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
      </select>

      {/* Amount */}
      <input type="number" value={reward.rewardAmount}
        onChange={(e) => onChange({ ...reward, rewardAmount: parseInt(e.target.value) || 1 })}
        className="w-16 rounded-xl border px-2 py-1.5 text-[12px] text-center outline-none"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />

      {/* Tier toggle */}
      <button onClick={() => onChange({ ...reward, tier: reward.tier === "free" ? "vip" : "free", isVipOnly: reward.tier !== "vip" })}
        className="text-[9px] font-black px-2 py-1 rounded-full border flex-shrink-0"
        style={reward.tier === "vip"
          ? { background: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24" }
          : { background: "rgba(124,58,237,0.1)", borderColor: BORDER, color: V }}>
        {reward.tier === "vip" ? "⭐ VIP" : "FREE"}
      </button>

      {/* Rarity */}
      <select value={reward.rarity} onChange={(e) => onChange({ ...reward, rarity: e.target.value as Rarity })}
        className="rounded-xl border px-2 py-1.5 text-[11px] outline-none"
        style={{ background: SURF, borderColor: `${rarityColor}50`, color: rarityColor, fontFamily: "inherit", minWidth: 90 }}>
        {RARITY_OPTIONS.map((r) => <option key={r.value} value={r.value} style={{ color: r.color }}>{r.value.charAt(0).toUpperCase() + r.value.slice(1)}</option>)}
      </select>

      {/* Delete */}
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-[13px] transition-opacity"
        style={{ color: P, background: "none", border: "none", cursor: "pointer" }}>✕</button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type AgencyTab = "tasks" | "rewards" | "season";

export default function AgencyFanPassManager({ season }: { season?: Season }) {
  const [activeTab, setActiveTab] = useState<AgencyTab>("tasks");
  const [freeTasks, setFreeTasks]         = useState<Task[]>(DEFAULT_FREE_TASKS.map((t, i) => ({ ...t, id: undefined })));
  const [premiumTasks, setPremiumTasks]   = useState<Task[]>(DEFAULT_PREMIUM_TASKS.map((t, i) => ({ ...t, id: undefined })));
  const [rewards, setRewards]             = useState<RewardRow[]>(() => generateDefaultRewards());
  const [isSaving, setIsSaving]           = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [taskFilter, setTaskFilter]       = useState<"all" | "free" | "premium">("all");

  function generateDefaultRewards(): RewardRow[] {
    const rows: RewardRow[] = [];
    for (let level = 1; level <= 50; level++) {
      // Free track
      rows.push({
        level,
        tier:         "free",
        rewardType:   level % 10 === 0 ? "badge" : level % 5 === 0 ? "streak_freeze" : "coins",
        icon:         level % 10 === 0 ? "🏅" : level % 5 === 0 ? "🧊" : "🪙",
        label:        level % 10 === 0 ? `Level ${level} Badge` : level % 5 === 0 ? "Streak Freeze" : `${level * 25} Coins`,
        description:  "",
        rewardAmount: level % 10 === 0 ? 1 : level % 5 === 0 ? 1 : level * 25,
        isVipOnly:    false,
        rarity:       level >= 40 ? "epic" : level >= 20 ? "rare" : "common",
      });
      // VIP track (every 5 levels, last level is mystery box)
      if (level % 5 === 0) {
        const isLast = level === 50;
        rows.push({
          level,
          tier:         "vip",
          rewardType:   isLast ? "mystery_box" : level % 10 === 0 ? "booster_xp" : "coins",
          icon:         isLast ? "🎁" : level % 10 === 0 ? "🔥" : "💎",
          label:        isLast ? "🎁 Mystery Pack" : level % 10 === 0 ? `${level * 2}% XP Boost` : `${level * 60} Coins`,
          description:  isLast ? "A mystery pack containing rare or legendary rewards!" : "",
          rewardAmount: isLast ? 1 : level % 10 === 0 ? level * 2 : level * 60,
          isVipOnly:    true,
          rarity:       isLast ? "legendary" : level >= 40 ? "epic" : level >= 20 ? "rare" : "common",
        });
      }
    }
    return rows;
  }

  const addFreeTask = () => setFreeTasks((p) => [...p, { title: "", description: "", icon: "⭐", xpReward: 30, coinReward: 0, tier: "free", type: "weekly", isActive: true }]);
  const addPremiumTask = () => setPremiumTasks((p) => [...p, { title: "", description: "", icon: "💎", xpReward: 100, coinReward: 30, tier: "premium", type: "weekly", isActive: true }]);

  const addReward = () => {
    const maxLevel = rewards.length > 0 ? Math.max(...rewards.map((r) => r.level)) : 0;
    setRewards((p) => [...p, { level: maxLevel + 1, tier: "free", rewardType: "coins", icon: "🪙", label: "Coins", description: "", rewardAmount: 100, isVipOnly: false, rarity: "common" }]);
  };

  const handleSave = async () => {
    if (!season?.id) { setError("No active season selected."); return; }
    setIsSaving(true);
    setError(null);
    try {
      const allTasks = [
        ...freeTasks.map((t) => ({ ...t, tier: "free", type: "weekly" })),
        ...premiumTasks.map((t) => ({ ...t, tier: "premium", type: "weekly" })),
        // Streak task always included
        { title: "7-Day Login Streak", description: "Log in every day for 7 days straight.", icon: "🔥", xpReward: 200, coinReward: 100, tier: "free", type: "streak", isActive: true },
      ];
      await fetch(`/api/agency/fan-pass/seasons/${season.id}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: allTasks }),
      });
      await fetch(`/api/agency/fan-pass/seasons/${season.id}/rewards`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewards }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const TABS: { id: AgencyTab; label: string; icon: string }[] = [
    { id: "tasks",   label: "Tasks",   icon: "📋" },
    { id: "rewards", label: "Rewards", icon: "🏆" },
    { id: "season",  label: "Season",  icon: "⚙️" },
  ];

  const visibleFree    = freeTasks.filter((t) => taskFilter === "all" || taskFilter === "free");
  const visiblePremium = premiumTasks.filter((t) => taskFilter === "all" || taskFilter === "premium");

  return (
    <div className="w-full flex flex-col gap-5" style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[18px] font-black" style={{ color: TEXT }}>Fan Pass Manager</h2>
          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
            {season ? `Season: ${season.name}` : "No active season"}
          </p>
        </div>
        <div className="flex gap-2">
          <GradBtn variant="ghost" size="sm" onClick={() => {}}>Preview</GradBtn>
          <GradBtn size="sm" onClick={handleSave} disabled={isSaving || !season}>
            {isSaving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
          </GradBtn>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span><p className="text-[12px] font-bold flex-1" style={{ color: P }}>{error}</p>
          <button onClick={() => setError(null)} style={{ color: MUTED }}>✕</button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black border-b-2 transition-all"
            style={activeTab === tab.id
              ? { color: TEXT, borderColor: V }
              : { color: MUTED, borderColor: "transparent" }}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ── TASKS TAB ── */}
      {activeTab === "tasks" && (
        <div className="flex flex-col gap-5">
          {/* Info box */}
          <div className="rounded-[14px] border px-4 py-3 flex items-start gap-3"
            style={{ background: "rgba(124,58,237,0.05)", borderColor: BORDER }}>
            <span className="text-[18px]">🎲</span>
            <div>
              <p className="text-[12px] font-black" style={{ color: TEXT }}>How weekly tasks work</p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                Each week 2 tasks are randomly selected — 1 from the Free pool and 1 from the Premium pool.
                A 3rd task (7-day login streak) is always shown to all users. Premium users also see and can complete the free tasks.
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(["all", "free", "premium"] as const).map((f) => (
              <button key={f} onClick={() => setTaskFilter(f)}
                className="px-3 py-1.5 rounded-full text-[10px] font-black border transition-all capitalize"
                style={taskFilter === f
                  ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: TEXT }
                  : { background: "transparent", borderColor: BORDER, color: MUTED }}>
                {f === "all" ? "All Tasks" : `${f.charAt(0).toUpperCase() + f.slice(1)} (${f === "free" ? freeTasks.length : premiumTasks.length})`}
              </button>
            ))}
          </div>

          {/* Free tasks */}
          {(taskFilter === "all" || taskFilter === "free") && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: V }}>Free Tasks</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black" style={{ background: "rgba(124,58,237,0.12)", color: V }}>{freeTasks.length}</span>
                </div>
                <GradBtn variant="ghost" size="sm" onClick={addFreeTask}>+ Add Free Task</GradBtn>
              </div>
              {visibleFree.map((task, i) => (
                <TaskRow key={i} task={task} index={i}
                  onChange={(t) => setFreeTasks((p) => p.map((x, j) => j === i ? t : x))}
                  onDelete={() => setFreeTasks((p) => p.filter((_, j) => j !== i))} />
              ))}
              {visibleFree.length === 0 && (
                <p className="text-center py-6 text-[12px]" style={{ color: MUTED }}>No free tasks yet. Add one above.</p>
              )}
            </div>
          )}

          {/* Premium tasks */}
          {(taskFilter === "all" || taskFilter === "premium") && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: "#fbbf24" }}>Premium Tasks</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>{premiumTasks.length}</span>
                </div>
                <GradBtn variant="ghost" size="sm" onClick={addPremiumTask}>+ Add Premium Task</GradBtn>
              </div>
              {visiblePremium.map((task, i) => (
                <TaskRow key={i} task={task} index={i}
                  onChange={(t) => setPremiumTasks((p) => p.map((x, j) => j === i ? t : x))}
                  onDelete={() => setPremiumTasks((p) => p.filter((_, j) => j !== i))} />
              ))}
              {visiblePremium.length === 0 && (
                <p className="text-center py-6 text-[12px]" style={{ color: MUTED }}>No premium tasks yet. Add one above.</p>
              )}
            </div>
          )}

          {/* Streak task (always shown, not editable title) */}
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.3)" }}>Default Task (always shown)</p>
            <div className="rounded-[14px] border px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(251,152,36,0.05)", borderColor: "rgba(251,152,36,0.25)" }}>
              <span className="text-[20px]">🔥</span>
              <div className="flex-1">
                <p className="text-[13px] font-black" style={{ color: TEXT }}>7-Day Login Streak</p>
                <p className="text-[11px]" style={{ color: MUTED }}>Log in every day for 7 days · +200 XP · +100 🪙 · shown to all users</p>
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: "rgba(251,152,36,0.15)", color: "#fb923c" }}>Default</span>
            </div>
          </div>
        </div>
      )}

      {/* ── REWARDS TAB ── */}
      {activeTab === "rewards" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[12px] font-black" style={{ color: TEXT }}>Reward Track</p>
              <p className="text-[11px]" style={{ color: MUTED }}>
                Set rewards for each level. Level 50 VIP track ends with a Mystery Pack (legendary). Users only see 5 milestones at a time.
              </p>
            </div>
            <GradBtn variant="ghost" size="sm" onClick={addReward}>+ Add Level</GradBtn>
          </div>

          {/* Column labels */}
          <div className="grid grid-cols-[2rem_2rem_1fr_7rem_4rem_3rem_5.5rem_1rem] gap-3 px-4">
            {["Lvl", "Icon", "Label", "Type", "Amt", "Tier", "Rarity", ""].map((h) => (
              <p key={h} className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.3)" }}>{h}</p>
            ))}
          </div>

          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {rewards
              .sort((a, b) => a.level - b.level || (a.tier === "free" ? -1 : 1))
              .map((reward, i) => (
                <RewardRow key={i} reward={reward}
                  onChange={(r) => setRewards((p) => p.map((x, j) => j === i ? r : x))}
                  onDelete={() => setRewards((p) => p.filter((_, j) => j !== i))} />
              ))}
          </div>

          {/* Mystery pack note */}
          <div className="rounded-[14px] border px-4 py-3 flex items-start gap-3"
            style={{ background: "rgba(251,191,36,0.05)", borderColor: "rgba(251,191,36,0.25)" }}>
            <span className="text-[18px]">🎁</span>
            <div>
              <p className="text-[12px] font-black" style={{ color: TEXT }}>Mystery Pack at Final Level</p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                The VIP track reward at the final level is automatically set as a Mystery Pack with legendary rarity.
                It will open the Mystery Box system and grant a random reward from the mystery_box pool.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SEASON TAB ── */}
      {activeTab === "season" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border p-5 flex flex-col gap-4"
            style={{ background: CARD, borderColor: BORDER }}>
            <p className="text-[13px] font-black" style={{ color: TEXT }}>Season Settings</p>
            {season ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Season Name", value: season.name },
                  { label: "Status",      value: season.status },
                  { label: "Start Date",  value: new Date(season.startDate).toLocaleDateString() },
                  { label: "End Date",    value: new Date(season.endDate).toLocaleDateString() },
                  { label: "Max Level",   value: String(season.maxLevel) },
                  { label: "XP Per Level",value: String(season.xpPerLevel) },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <Label>{f.label}</Label>
                    <div className="rounded-xl border px-3 py-2.5 text-[13px] font-bold"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER, color: TEXT }}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: MUTED }}>No active season. Create one from the Seasons panel.</p>
            )}
          </div>

          {/* XP Reset */}
          <div className="rounded-[14px] border p-5 flex flex-col gap-4"
            style={{ background: "rgba(239,57,118,0.04)", borderColor: "rgba(239,57,118,0.2)" }}>
            <div>
              <p className="text-[13px] font-black" style={{ color: TEXT }}>End Season & Reset XP</p>
              <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                Ending a season snapshots every user&apos;s final XP and level for the leaderboard, then resets all XP to 0 and levels back to 1 for the new season.
                This cannot be undone.
              </p>
            </div>
            <GradBtn variant="danger" size="md"
              onClick={() => {
                if (!season) return;
                if (confirm(`End "${season.name}" and reset all user XP? This cannot be undone.`)) {
                  fetch(`/api/fan-pass/xp-reset`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
                    body: JSON.stringify({ seasonId: season.id }),
                  });
                }
              }}
              disabled={!season || season.status !== "active"}>
              ⚠️ End Season & Reset XP
            </GradBtn>
          </div>
        </div>
      )}
    </div>
  );
}