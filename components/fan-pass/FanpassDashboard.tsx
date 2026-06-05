"use client";

import { useState, useEffect, useCallback } from "react";
import { getLevelFromXp } from "@/lib/xp";
import { getMockQuests, getMockRewardTrack, getMockLeaderboard } from "@/lib/fanpass-mock"
import type { Quest, RewardNode, LeaderboardEntry,  } from "@/lib/fanpass-mock";
import { useLoginBonus, formatCountdown } from "@/lib/hooks/use-login-bonus";

// ─── Tiny utility ─────────────────────────────────────────────────────────────
function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Theme constants ──────────────────────────────────────────────────────────
const P   = "#ef3976";   // pink primary
const V   = "#7c3aed";   // violet secondary
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const BG   = "#0d0d1a";
const SURF = "#13112b";
const CARD = "#1a1635";

// ─── Glass card primitive ─────────────────────────────────────────────────────
function GlassCard({ children, className, style, onClick }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-2xl border transition-all duration-200", className)}
      style={{
        background: CARD,
        borderColor: "rgba(124,58,237,0.2)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Gradient text ────────────────────────────────────────────────────────────
function GradText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn("font-black", className)}
      style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
    >
      {children}
    </span>
  );
}

// ─── Quest card ───────────────────────────────────────────────────────────────
function QuestCard({ quest }: { quest: Quest }) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        background: quest.completed ? "rgba(124,58,237,0.05)" : "rgba(255,255,255,0.03)",
        borderColor: quest.completed ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.1)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn(
          "text-[12px] font-semibold",
          quest.completed ? "line-through opacity-50" : "text-[#f0eaff]"
        )}>
          {quest.title}
        </p>
        {quest.completed
          ? <span className="size-5 rounded-full bg-green-500 flex items-center justify-center text-[9px] text-white font-black shrink-0">✓</span>
          : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(239,57,118,0.15)", color: P }}>
              +{quest.xpReward} XP
            </span>
        }
      </div>
      {!quest.completed && quest.target > 1 && (
        <div className="mt-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.15)" }}>
            <div className="h-full rounded-full" style={{ width: `${quest.progress}%`, background: GRAD }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reward track node ────────────────────────────────────────────────────────
function RewardNodeRow({ node, isCurrentLevel }: { node: RewardNode; isCurrentLevel: boolean }) {
  const free = node.free;
  const vip  = node.vip;

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Free side */}
      <div className="flex-1 flex justify-end">
        {free && (
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-2xl border w-28",
              free.claimed && "opacity-60"
            )}
            style={{
              background: free.claimed ? "rgba(34,197,94,0.08)" : free.available ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)",
              borderColor: free.claimed ? "rgba(34,197,94,0.3)" : free.available ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
            }}
          >
            {free.claimed && (
              <div className="absolute -top-1.5 -right-1.5 size-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white font-black">✓</div>
            )}
            <div className="size-12 rounded-xl flex items-center justify-center text-2xl relative"
              style={{ background: free.claimed ? "rgba(34,197,94,0.15)" : "rgba(124,58,237,0.12)" }}>
              {free.icon}
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-center"
              style={{ color: free.claimed ? "#4ade80" : "rgba(240,234,255,0.6)" }}>
              {free.label}
            </p>
          </div>
        )}
      </div>

      {/* Level pill */}
      <div
        className="shrink-0 size-12 rounded-full flex items-center justify-center text-[13px] font-black border-4 z-10"
        style={
          isCurrentLevel
            ? { background: GRAD, borderColor: BG, color: "#fff", boxShadow: `0 0 0 4px rgba(239,57,118,0.25)` }
            : node.level < 15
            ? { background: "rgba(239,57,118,0.5)", borderColor: BG, color: "#fff" }
            : { background: SURF, borderColor: "rgba(124,58,237,0.2)", color: "rgba(240,234,255,0.3)" }
        }
      >
        {node.level}
      </div>

      {/* VIP side */}
      <div className="flex-1 flex justify-start">
        {vip && (
          <div
            className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border w-28"
            style={{
              background: vip.available && !vip.claimed ? "rgba(239,57,118,0.1)" : "rgba(255,255,255,0.02)",
              borderColor: vip.available && !vip.claimed ? "rgba(239,57,118,0.4)" : "rgba(124,58,237,0.12)",
              boxShadow: vip.available && !vip.claimed ? `0 0 16px rgba(239,57,118,0.15)` : "none",
            }}
          >
            {!vip.available && (
              <span className="absolute -top-2 -right-2 text-[#ef3976] text-[13px]">🔒</span>
            )}
            {vip.available && !vip.claimed && (
              <span
                className="absolute -top-2 -right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse"
                style={{ background: P, color: "#fff" }}
              >
                Available
              </span>
            )}
            <div className="size-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: vip.available ? "rgba(239,57,118,0.2)" : "rgba(124,58,237,0.06)" }}>
              {vip.icon}
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-center"
              style={{ color: vip.available ? P : "rgba(240,234,255,0.3)" }}>
              {vip.label}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface FansPassDashboardProps {
  seasonId?: number;
  user: { id: string; name: string; image: string | null; isVip: boolean };
  initialXp?: number;
  initialStreak?: number;
  initialCoins?: number;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FansPassDashboard({
  seasonId = 1,
  user,
  initialXp = 1500,
  initialStreak = 5,
  initialCoins = 28500,
}: FansPassDashboardProps) {
  const passLevel = getLevelFromXp(initialXp);
  const quests    = getMockQuests();
  const rewards   = getMockRewardTrack(passLevel.level);
  const leaders   = getMockLeaderboard(user.id);

  const [activeQuestTab, setActiveQuestTab] = useState<"daily" | "weekly">("daily");
  const dailyQuests  = quests.filter(q => q.category === "daily");
  const weeklyQuests = quests.filter(q => q.category === "weekly");
  const shownQuests  = activeQuestTab === "daily" ? dailyQuests : weeklyQuests;

  // Login bonus hook for the streak state in the header
  const { data: bonusData } = useLoginBonus(seasonId);
  const streak = bonusData?.currentStreak ?? initialStreak;
  const canClaim = bonusData?.canClaimToday ?? false;

  return (
    <div className="w-full"
  style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: "#f0eaff" }}>
      {/* ── Top header bar (matches screenshot 1 layout) ── */}
<div className="flex items-center justify-between px-6 py-4 border-b"
  style={{ borderColor: "rgba(124,58,237,0.12)" }}>
  <div className="flex items-center gap-3">
    <span className="text-[20px]">🏆</span>
    <div>
      <h1 className="text-[18px] font-black text-[#f0eaff] leading-none">Fans Pass</h1>
      <p className="text-[11px] mt-0.5" style={{ color: "rgba(240,234,255,0.4)" }}>
        Level {passLevel.level} · {initialXp.toLocaleString()} XP
      </p>
    </div>
  </div>
  {user.isVip ? (
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black border"
      style={{ background: "rgba(239,57,118,0.1)", borderColor: "rgba(239,57,118,0.3)", color: P }}>
      💎 VIP
    </div>
  ) : (
    <button className="rounded-full px-4 py-1.5 text-[12px] font-black text-white"
      style={{ background: GRAD }}>
      Premium
    </button>
  )}
</div>

      {/* ── 3-column layout (mirrors screenshot 1 exactly) ── */}
      <div className="flex h-[calc(100vh-130px)] overflow-hidden">

        {/* ══ LEFT SIDEBAR: Active Quests ══ */}
        <aside
          className="hidden lg:flex w-80 flex-col gap-5 border-r overflow-y-auto p-5"
          style={{ borderColor: "rgba(124,58,237,0.1)", background: "rgba(19,17,43,0.6)" }}
        >
          {/* Quest header */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[14px]">📋</span>
              <h2 className="text-[14px] font-black text-[#f0eaff]">Active Quests</h2>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 mb-4">
              {(["daily", "weekly"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveQuestTab(cat)}
                  className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all"
                  style={
                    activeQuestTab === cat
                      ? { background: "rgba(239,57,118,0.15)", borderColor: "rgba(239,57,118,0.4)", color: P }
                      : { background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.12)", color: "rgba(240,234,255,0.4)" }
                  }
                >
                  {cat === "daily" ? "⏱ Daily" : "📅 Weekly"}
                </button>
              ))}
            </div>
          </div>

          {/* Quest list */}
          <div className="flex flex-col gap-2.5">
            {/* Reset timer */}
            {activeQuestTab === "daily" && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#f0eaff]/30">⏱ Daily</span>
                <span className="text-[9px] font-bold" style={{ color: P }}>12h Left</span>
              </div>
            )}

            {shownQuests.map((q) => <QuestCard key={q.id} quest={q} />)}
          </div>

          {/* Streak status */}
          <GlassCard className="p-4 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[16px]">🔥</span>
              <span className="text-[12px] font-black text-[#f0eaff]">{streak}-Day Streak</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: "rgba(124,58,237,0.15)" }}>
              <div className="h-full rounded-full" style={{ width: `${(streak / 7) * 100}%`, background: GRAD }} />
            </div>
            {canClaim && (
              <a href="#login-bonus" className="block w-full text-center py-2 rounded-xl text-[11px] font-black text-white"
                style={{ background: GRAD }}>
                Claim Today&apos;s Bonus!
              </a>
            )}
          </GlassCard>

          {/* VIP upsell card */}
          {!user.isVip && (
            <div
              className="relative mt-auto rounded-2xl p-5 overflow-hidden"
              style={{ background: GRAD }}
            >
              <div className="absolute -right-4 -bottom-4 text-[60px] opacity-15 pointer-events-none">💎</div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/70 mb-1">Unlock More</p>
              <h3 className="text-[15px] font-black text-white leading-tight mb-2">
                Unlock 50+ Premium Rewards
              </h3>
              <p className="text-[11px] text-white/80 mb-3">
                Get exclusive badges, emotes, and direct messaging priority.
              </p>
              <button className="w-full py-2 rounded-xl text-[12px] font-black bg-white"
                style={{ color: V }}>
                Upgrade Now
              </button>
            </div>
          )}
        </aside>

        {/* ══ CENTRE: Reward Track ══ */}
        <main className="flex-1 overflow-y-auto">
          {/* Track header */}
          <div className="flex justify-between items-center px-8 pt-8 pb-4">
            <div className="flex-1 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f0eaff]/35">
                Free Track
              </span>
            </div>
            <div className="w-20" />
            <div className="flex-1 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: P }}>
                Premium Track
              </span>
            </div>
          </div>

          {/* Track scroll */}
          <div className="relative px-8 pb-16">
            {/* Centre dashed line */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
              style={{
                background: `repeating-linear-gradient(to bottom, ${P} 0px, ${P} 8px, transparent 8px, transparent 16px)`,
                opacity: 0.3,
              }}
            />

            <div className="flex flex-col gap-16 relative">
              {rewards.map((node) => (
                <RewardNodeRow
                  key={node.level}
                  node={node}
                  isCurrentLevel={node.level === passLevel.level}
                />
              ))}
            </div>
          </div>
        </main>

        {/* ══ RIGHT SIDEBAR: Stats + Leaderboard ══ */}
        <aside
          className="hidden xl:flex w-72 flex-col gap-5 border-l overflow-y-auto p-5"
          style={{ borderColor: "rgba(124,58,237,0.1)", background: "rgba(19,17,43,0.6)" }}
        >
          {/* Progress Stats */}
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#f0eaff]/35 mb-4">
              Progress Stats
            </h2>

            <div className="flex flex-col gap-3">
              <GlassCard className="p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#f0eaff]/40 mb-1">
                  Time Remaining
                </p>
                <p className="text-[26px] font-black leading-none" style={{ color: P }}>14 Days</p>
              </GlassCard>

              <GlassCard className="p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#f0eaff]/40 mb-1">
                  Total XP Earned
                </p>
                <p className="text-[26px] font-black text-[#f0eaff] leading-none">
                  {initialCoins.toLocaleString()}
                </p>
              </GlassCard>

              {/* Season progress bar */}
              <GlassCard className="p-4">
                <div className="flex justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#f0eaff]/40">Season</p>
                  <p className="text-[9px] font-bold" style={{ color: V }}>53% done</p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.15)" }}>
                  <div className="h-full rounded-full" style={{ width: "53%", background: GRAD }} />
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Top Fans */}
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#f0eaff]/35 mb-4">
              Top Fans
            </h2>
            <div className="flex flex-col gap-2">
              {leaders.slice(0, 5).map((entry) => (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group",
                  )}
                  style={{
                    background: entry.isCurrentUser ? "rgba(239,57,118,0.08)" : "rgba(124,58,237,0.04)",
                    borderColor: entry.isCurrentUser ? "rgba(239,57,118,0.3)" : "rgba(124,58,237,0.1)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="size-9 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 border"
                    style={{
                      background: entry.avatarColor + "30",
                      borderColor: entry.avatarColor + "60",
                      color: entry.avatarColor,
                    }}
                  >
                    {entry.displayName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate text-[#f0eaff] group-hover:text-[#ef3976] transition-colors">
                      {entry.isCurrentUser ? "You" : entry.displayName}
                    </p>
                    <p className="text-[9px] text-[#f0eaff]/40">Level {entry.level}</p>
                  </div>

                  <span
                    className="text-[13px] font-black shrink-0"
                    style={{ color: entry.rank === 1 ? P : "rgba(240,234,255,0.3)" }}
                  >
                    #{entry.rank}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily bonus quick claim */}
          {canClaim && (
            <GlassCard className="p-4 mt-auto" style={{ borderColor: "rgba(239,57,118,0.3)", background: "rgba(239,57,118,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[18px]">🔥</span>
                <div>
                  <p className="text-[11px] font-black text-[#f0eaff]">Daily Bonus Ready!</p>
                  <p className="text-[9px] text-[#f0eaff]/40">{streak}-day streak</p>
                </div>
              </div>
              <button
                className="w-full py-2 rounded-xl text-[11px] font-black text-white"
                style={{ background: GRAD }}
              >
                Claim Now
              </button>
            </GlassCard>
          )}
        </aside>
       
      </div>
    </div>
  );
}

// helper (avoids importing twice)
function xpForNextFromLevel(level: number): number {
  return Math.floor(150 * Math.pow(level, 1.4));
}