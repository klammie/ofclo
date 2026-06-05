"use client";

import type { PassLevel, InitialPassData, DashboardUser } from "@/lib/types";

function levelBadgeColor(level: number): string {
  if (level >= 50) return "#fbbf24";
  if (level >= 35) return "#a78bfa";
  if (level >= 20) return "#38bdf8";
  if (level >= 10) return "#4ade80";
  if (level >= 5)  return "#7c3aed";
  return "#94a3b8";
}

interface OverviewTabProps {
  user:        DashboardUser;
  passLevel:   PassLevel;
  passData:    InitialPassData;
  onTabChange: (tab: string) => void;
}

const QUICK_ACTIONS = [
  { icon: "❤️", label: "Like Posts",     xp: "+25 XP"  },
  { icon: "💬", label: "Leave Comment",  xp: "+15 XP"  },
  { icon: "👥", label: "Refer a Friend", xp: "+100 XP" },
  { icon: "🎯", label: "Join Campaign",  xp: "+150 XP" },
];

export default function OverviewTab({ user, passLevel, passData, onTabChange }: OverviewTabProps) {
  const badgeColor = levelBadgeColor(passLevel.level);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Hero card ── */}
      <div
        className="relative rounded-[24px] overflow-hidden border p-6"
        style={{
          background:  "linear-gradient(135deg, rgba(239,57,118,0.12) 0%, rgba(34,16,22,0.9) 60%)",
          borderColor: "rgba(239,57,118,0.2)",
        }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(239,57,118,0.15) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="size-16 rounded-full flex items-center justify-center text-2xl border-2 overflow-hidden"
              style={{ borderColor: badgeColor, background: "rgba(239,57,118,0.2)" }}>
              {user.image
                ? <img src={user.image} alt={user.name} className="size-full object-cover" />
                : <span className="font-black text-white">{user.name[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="absolute -bottom-1 -right-1 size-6 rounded-full flex items-center justify-center text-[9px] font-black"
              style={{ background: badgeColor, color: "#0d0d1a" }}>
              {passLevel.level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[18px] font-black text-white truncate">{user.name}</h2>
              {user.isVip && (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                  style={{ background: "rgba(239,57,118,0.2)", border: "1px solid rgba(239,57,118,0.4)", color: "#ef3976" }}>
                  VIP Pass
                </span>
              )}
            </div>
            <p className="text-[12px] mt-0.5 font-bold" style={{ color: badgeColor }}>
              {passLevel.title} · Level {passLevel.level}
            </p>

            {/* ── XP bar — clickable link to quests tab ── */}
            <button
              onClick={() => onTabChange("quests")}
              className="w-full text-left mt-3 group"
              title="View quests to earn XP"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  {passLevel.currentXp.toLocaleString()} / {passLevel.xpForNextLevel.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold transition-opacity opacity-60 group-hover:opacity-100"
                  style={{ color: badgeColor }}>
                  {passLevel.progressPercent}%
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </span>
              </div>

              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:      `${passLevel.progressPercent}%`,
                    background: `linear-gradient(90deg, #ef3976, ${badgeColor})`,
                    boxShadow:  `0 0 8px ${badgeColor}60`,
                  }}
                />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all rounded-full" />
              </div>

              <p className="text-[10px] text-white/30 mt-1 group-hover:text-white/50 transition-colors">
                {(passLevel.xpForNextLevel - passLevel.currentXp).toLocaleString()} XP to Level {passLevel.level + 1}
                <span className="ml-1.5 font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#ef3976" }}>
                  → Do quests
                </span>
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total XP",    value: passData.totalXpEarned.toLocaleString(),    icon: "⚡", color: "#ef3976" },
          { label: "Coins",       value: passData.totalCoinsEarned.toLocaleString(), icon: "💰", color: "#fbbf24" },
          { label: "Day Streak",  value: `${passData.currentStreak}d`,              icon: "🔥", color: "#fb923c" },
          { label: "Best Streak", value: `${passData.longestStreak}d`,              icon: "🏆", color: "#c084fc" },
        ].map((s) => (
          <div key={s.label}
            className="flex flex-col gap-1 rounded-[14px] border p-3.5"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px]">{s.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                {s.label}
              </span>
            </div>
            <span className="text-[20px] font-black text-white leading-none">{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Streak freeze ── */}
      {passData.streakFreezes > 0 && (
        <div className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
          style={{ background: "rgba(59,130,246,0.07)", borderColor: "rgba(59,130,246,0.2)" }}>
          <span className="text-[22px]">🛡️</span>
          <div>
            <p className="text-[12px] font-bold text-blue-300">
              {passData.streakFreezes} Streak Freeze{passData.streakFreezes > 1 ? "s" : ""} Active
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Your streak is protected if you miss a day
            </p>
          </div>
        </div>
      )}

      {/* ── Quick XP actions ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3"
          style={{ color: "rgba(255,255,255,0.35)" }}>
          Quick XP Actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => onTabChange("quests")}
              className="flex items-center gap-3 rounded-[14px] border p-3.5 text-left transition-all duration-150 group"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(239,57,118,0.3)";
                e.currentTarget.style.background  = "rgba(239,57,118,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.background  = "rgba(255,255,255,0.03)";
              }}
            >
              <span className="text-[20px]">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white group-hover:text-[#ef3976] transition-colors truncate">
                  {a.label}
                </p>
                <p className="text-[10px] font-bold" style={{ color: "#ef3976" }}>{a.xp}</p>
              </div>
              <svg className="flex-shrink-0 transition-colors text-white/20 group-hover:text-[#ef3976]"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ── VIP upsell ── */}
      {!user.isVip && (
        <div className="relative rounded-[24px] overflow-hidden border p-5"
          style={{
            background:  "linear-gradient(135deg, #ef3976 0%, #c0305f 100%)",
            borderColor: "rgba(239,57,118,0.3)",
          }}>
          <div className="absolute -right-4 -bottom-4 text-[80px] opacity-10 pointer-events-none select-none">💎</div>
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-1">Unlock More</p>
            <h3 className="text-[17px] font-black text-white leading-tight mb-2">
              Go VIP · 2× XP on Everything
            </h3>
            <p className="text-[12px] text-white/80 mb-4">
              Instant reward unlocks, exclusive badges, priority DMs and double XP on every action.
            </p>
            <button className="bg-white rounded-full px-5 py-2 text-[12px] font-black hover:bg-white/90 active:scale-[0.97] transition-all"
              style={{ color: "#ef3976" }}>
              Upgrade to VIP Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}