"use client";

import { useState } from "react";
import { getLevelFromXp } from "@/lib/xp";

// Inline badge colour — replaces the missing levelBadgeColor export
function levelBadgeColor(level: number): string {
  if (level >= 50) return "#fbbf24"; // legendary gold
  if (level >= 35) return "#a78bfa"; // epic purple
  if (level >= 20) return "#38bdf8"; // rare blue
  if (level >= 10) return "#4ade80"; // green
  if (level >= 5)  return "#7c3aed"; // purple
  return "#94a3b8";                  // common grey
}
import type {
  FansPassTab,
  DashboardUser,
  InitialPassData,
  PassLevel,
} from "@/types/fans-pass";
import type {
  LiveSeason,
  LiveReward,
  LiveDayConfig,
  LiveMilestone,
  LiveLeaderboardEntry,
} from "@/lib/fan-pass-live.service";

import OverviewTab    from "./tabs/OverviewTab";
import RewardsTab     from "./tabs/RewardsTab";
import QuestsTab      from "./tabs/QuestsTab";
import LeaderboardTab from "./tabs/LeaderboardTab";
import {LoginBonusPanel} from "./LoginBonusPanel";
import { LevelUpOverlay } from "./LevelUpOverlay";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const TABS: { id: FansPassTab; label: string; icon: string }[] = [
  { id: "overview",    label: "Overview",    icon: "🏠" },
  { id: "rewards",     label: "Rewards",     icon: "🎁" },
  { id: "quests",      label: "Quests",      icon: "🎯" },
  { id: "login-bonus", label: "Daily Bonus", icon: "🔥" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface FansPassDashboardProps {
  season:              LiveSeason;
  initialPassData:     InitialPassData & { currentDaySlot?: number };
  initialRewards:      LiveReward[];
  initialDayConfig:    LiveDayConfig[];
  initialMilestones:   LiveMilestone[];
  initialLeaderboard:  LiveLeaderboardEntry[];
  user:                DashboardUser;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FansPassDashboard({
  season,
  initialPassData,
  initialRewards,
  initialDayConfig,
  initialMilestones,
  initialLeaderboard,
  user,
}: FansPassDashboardProps) {
  const [activeTab, setActiveTab] = useState<FansPassTab>("overview");
  const [passData, setPassData]   = useState(initialPassData);
  const [rewards, setRewards]     = useState(initialRewards);

  const passLevel: PassLevel = getLevelFromXp(passData.totalXpEarned);
  const badgeColor = levelBadgeColor(passLevel.level);

  // Re-fetch pass data after login bonus claim
  async function refreshPassData() {
    try {
      const res = await fetch(`/api/fan-pass/season?refresh=1`);
      if (!res.ok) return;
      const data = await res.json();
      setPassData((prev) => ({
        ...prev,
        currentStreak:    data.currentStreak,
        totalXpEarned:    data.totalXpEarned,
        totalCoinsEarned: data.totalCoinsEarned,
        longestStreak:    data.longestStreak,
        streakFreezes:    data.streakFreezes,
        currentDaySlot:   data.currentDaySlot,
      }));
      // Refresh rewards so newly unlocked ones show available
      if (data.rewards) setRewards(data.rewards);
    } catch {}
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#0d0d1a", fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* Level-up celebration — fires automatically when passLevel.level increases */}
      <LevelUpOverlay passLevel={passLevel} seasonId={season.id} />

      {/* ── Page header ── */}
      <div className="relative overflow-hidden border-b border-[rgba(124,58,237,0.12)] px-4 sm:px-8 pt-5 sm:pt-8 pb-5 sm:pb-6">
        {/* Glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            {/* Title block — live season name + real days left */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
                  {season.name}
                </span>
                <span className="text-white/15">·</span>
                <span
                  className="text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ color: season.daysLeft <= 3 ? "#ef3976" : "#7c3aed" }}
                >
                  {season.daysLeft === 0 ? "Ends today" : `${season.daysLeft} days left`}
                </span>
              </div>
              <h1 className="text-[22px] sm:text-[32px] font-black text-white tracking-tight leading-none">
                Fans Pass
              </h1>
              <p className="text-[12px] text-white/40 mt-1">
                {season.description || "Earn XP, unlock rewards, climb the leaderboard"}
              </p>
            </div>

            {/* Level + VIP */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 bg-[rgba(255,255,255,0.04)] border border-white/[0.08] rounded-full px-4 py-2">
                <div
                  className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-[#0d0d1a]"
                  style={{ background: badgeColor }}
                >
                  {passLevel.level}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white">{passLevel.title}</p>
                  <p className="text-[9px] text-white/35">
                    {passLevel.currentXp.toLocaleString()}/{passLevel.xpForNextLevel.toLocaleString()} XP
                  </p>
                </div>
              </div>

              {user.isVip ? (
                <div className="flex items-center gap-1.5 bg-[rgba(124,58,237,0.15)] border border-[rgba(124,58,237,0.35)] rounded-full px-3 py-2">
                  <span className="text-[12px]">💎</span>
                  <span className="text-[10px] font-black" style={{ color: "#7c3aed" }}>VIP Pass</span>
                </div>
              ) : (
                <button
                  className="text-white rounded-full px-4 py-2 text-[11px] font-black hover:opacity-90 active:scale-[0.97] transition-all"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#ef3976)",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                  }}
                >
                  Get VIP · {season.vipPriceCents === 0
                    ? "Free"
                    : `$${(season.vipPriceCents / 100).toFixed(2)}/mo`}
                </button>
              )}
            </div>
          </div>

          {/* Season progress bar — live % */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[9px] text-white/25 font-bold uppercase tracking-widest">
                Season Progress
              </span>
              <span className="text-[9px] text-white/25">
                {season.progressPct}% through season
              </span>
            </div>
            <div className="h-1 bg-white/[0.07] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${season.progressPct}%`,
                  background: "linear-gradient(90deg,#7c3aed 0%,#ef3976 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar — desktop: top underline tabs, mobile: pill scroll row ── */}

      {/* Desktop tabs (sm+) */}
      <div className="hidden sm:block border-b border-[rgba(124,58,237,0.08)] px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-3 rounded-t-[10px] text-[11px] font-bold whitespace-nowrap transition-all duration-150 border-b-2",
                    isActive
                      ? "text-[#7c3aed] border-[#7c3aed] bg-[rgba(124,58,237,0.06)]"
                      : "text-white/40 border-transparent hover:text-white/60 hover:bg-white/[0.03]"
                  )}
                >
                  <span className="text-[13px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile tabs (below sm) — scrollable pill row with full labels */}
      <div className="sm:hidden px-4 py-3 border-b border-[rgba(124,58,237,0.08)]">
        <div className="flex gap-2 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-black whitespace-nowrap flex-shrink-0 transition-all duration-150 active:scale-95"
                style={isActive
                  ? {
                      background:  "rgba(124,58,237,0.18)",
                      border:      "1px solid rgba(124,58,237,0.5)",
                      color:       "#f0eaff",
                      boxShadow:   "0 0 10px rgba(124,58,237,0.2)",
                    }
                  : {
                      background:  "rgba(255,255,255,0.04)",
                      border:      "1px solid rgba(255,255,255,0.07)",
                      color:       "rgba(240,234,255,0.45)",
                    }
                }
              >
                <span className="text-[14px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">

          {activeTab === "overview" && (
            <OverviewTab
              user={user}
              passLevel={passLevel}
              passData={passData}
              season={season}
              milestones={initialMilestones}
              onTabChange={(tab) => setActiveTab(tab as FansPassTab)}
            />
          )}

          {activeTab === "rewards" && (
            <RewardsTab
              rewards={rewards}
              passLevel={passLevel}
              user={user}
              seasonId={season.id}              // NEW — required for claim calls
              featuredCreator={season.featuredCreator}  // NEW — from Step 4's service update
/>
          )}

          {activeTab === "quests" && (
            <QuestsTab
              user={user}
              seasonId={season.id}       // ← pass seasonId so QuestsTab can fetch live tasks
            />
          )}

          {activeTab === "login-bonus" && (
            <div className="max-w-lg mx-auto">
              <LoginBonusPanel
                seasonId={season.id}    // ← live season ID
                dayConfig={initialDayConfig}  // ← agency-configured slots
                className="w-full"
                onClaim={refreshPassData}
              />
            </div>
          )}

          {activeTab === "leaderboard" && (
            <LeaderboardTab
              entries={initialLeaderboard}  // ← live from DB
              currentUserId={user.id}
              seasonId={season.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}