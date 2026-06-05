"use client";

import { useState, useEffect, useCallback } from "react";
import { useLoginBonus, formatCountdown } from "@/lib/hooks/use-login-bonus";
import type { DayReward, StreakMilestone, ClaimResponse } from "@/lib/types";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.15)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Reward type config ───────────────────────────────────────────────────────
const REWARD_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  xp:              { label: "XP",          color: "#ef3976", bg: "rgba(239,57,118,0.1)",  border: "rgba(239,57,118,0.3)"  },
  coins:           { label: "Coins",       color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)"  },
  badge:           { label: "Badge",       color: "#a78bfa", bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.35)" },
  mystery_box:     { label: "Box",         color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.3)"  },
  mystery_box_low: { label: "Box",         color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.3)"  },
  gift:            { label: "Gift",        color: "#4ade80", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)"   },
  frame:           { label: "Frame",       color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)"  },
  booster_xp:      { label: "Booster",     color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.3)"  },
};
function rewardCfg(type: string) {
  return REWARD_TYPE_CONFIG[type] ?? { label: type, color: V, bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.3)" };
}

// ─── Day reward card ──────────────────────────────────────────────────────────
function DayCard({ day, isToday, justClaimed }: {
  day: DayReward; isToday: boolean; justClaimed: boolean;
}) {
  const cfg      = rewardCfg(day.rewardType);
  const claimed  = day.state === "claimed";
  const locked   = day.state === "locked";
  const showDone = claimed || (isToday && justClaimed);

  return (
    <div className="relative flex flex-col items-center gap-2 rounded-[18px] border p-3 transition-all duration-300 select-none"
      style={{
        background:  showDone  ? "rgba(34,197,94,0.08)"
                   : isToday   ? `${cfg.bg}`
                   : locked    ? "rgba(255,255,255,0.02)"
                   : "rgba(255,255,255,0.03)",
        borderColor: showDone  ? "rgba(34,197,94,0.4)"
                   : isToday   ? cfg.border
                   : locked    ? "rgba(255,255,255,0.06)"
                   : BORDER,
        boxShadow:   isToday && !showDone ? `0 0 18px ${cfg.color}30` : "none",
        transform:   isToday  ? "scale(1.04)" : "scale(1)",
        opacity:     locked   ? 0.45 : 1,
      }}>

      {/* State badge */}
      {showDone && (
        <div className="absolute -top-2 -right-2 size-5 rounded-full flex items-center justify-center text-[9px] font-black text-white z-10"
          style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }}>✓</div>
      )}
      {isToday && !showDone && (
        <div className="absolute -top-2 -right-2 size-5 rounded-full flex items-center justify-center text-[8px] font-black text-white z-10 animate-pulse"
          style={{ background: P }}>!</div>
      )}

      {/* Day label */}
      <p className="text-[9px] font-black uppercase tracking-widest"
        style={{ color: isToday ? cfg.color : "rgba(240,234,255,0.35)" }}>
        {day.label}
      </p>

      {/* Reward icon */}
      <div className="size-10 rounded-[12px] flex items-center justify-center text-[22px] border transition-all duration-300"
        style={{
          background:  showDone ? "rgba(34,197,94,0.12)" : isToday ? cfg.bg : "rgba(255,255,255,0.04)",
          borderColor: showDone ? "rgba(34,197,94,0.35)" : isToday ? cfg.border : "rgba(255,255,255,0.08)",
        }}>
        {showDone ? "✅" : locked ? "🔒" : day.icon}
      </div>

      {/* Reward label */}
      <div className="text-center">
        <p className="text-[10px] font-black leading-tight"
          style={{ color: showDone ? "#4ade80" : isToday ? cfg.color : MUTED }}>
          {showDone ? "Done!" : day.rewardLabel}
        </p>
        {/* Type pill */}
        {!locked && !showDone && (
          <span className="text-[8px] font-black rounded-full px-1.5 py-px mt-0.5 inline-block"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        )}
      </div>

      {/* Special day glow ring */}
      {day.isSpecialDay && !locked && (
        <div className="absolute inset-0 rounded-[18px] pointer-events-none"
          style={{ boxShadow: `inset 0 0 16px ${cfg.color}25`, border: `1px solid ${cfg.color}40` }} />
      )}
    </div>
  );
}

// ─── Claim animation overlay ──────────────────────────────────────────────────
function ClaimAnim({ reward, onDone }: { reward: DayReward; onDone: () => void }) {
  const cfg = rewardCfg(reward.rewardType);
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);

  const isItem = ["badge", "mystery_box", "gift", "frame"].includes(reward.rewardType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="flex flex-col items-center gap-4 text-center"
        style={{ animation: "claimPop 0.5s cubic-bezier(0.175,0.885,0.32,1.6) forwards" }}>
        <div className="text-[72px]" style={{ filter: `drop-shadow(0 0 24px ${cfg.color})` }}>
          {reward.icon}
        </div>
        <div className="rounded-2xl border px-8 py-5"
          style={{ background: CARD, borderColor: cfg.border, boxShadow: `0 0 40px ${cfg.color}40` }}>
          <p className="text-[13px] font-black uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
            Day {reward.daySlot} Reward
          </p>
          <p className="text-[26px] font-black text-white">{reward.rewardLabel}</p>
          {isItem && (
            <p className="text-[11px] mt-1.5 font-bold" style={{ color: "#4ade80" }}>
              ✓ Added to your inventory
            </p>
          )}
        </div>
      </div>
      <style>{`
        @keyframes claimPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Milestone row ────────────────────────────────────────────────────────────
function MilestoneRow({ milestone }: { milestone: StreakMilestone }) {
  const achieved = milestone.daysAway <= 0;
  const color    = achieved ? "#fbbf24" : "rgba(240,234,255,0.4)";
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-[14px] border transition-all"
      style={{
        background:  achieved ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.02)",
        borderColor: achieved ? "rgba(251,191,36,0.3)"  : BORDER,
      }}>
      <span className="text-[24px] flex-shrink-0">{milestone.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-black" style={{ color: achieved ? "#fbbf24" : TEXT }}>
            {milestone.title}
          </p>
          {milestone.claimed && (
            <span className="text-[9px] font-black rounded-full px-1.5 py-px"
              style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>✓ Claimed</span>
          )}
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{milestone.rewardLabel}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {achieved ? (
          <span className="text-[11px] font-black" style={{ color: "#fbbf24" }}>🎉 Unlocked</span>
        ) : (
          <span className="text-[11px] font-bold" style={{ color: MUTED }}>
            {milestone.daysAway}d away
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface LoginBonusPanelProps { seasonId: number; isVip?: boolean; }

export function LoginBonusPanel({ seasonId, isVip = false }: LoginBonusPanelProps) {
  const { data, isLoading, isClaiming, error, claim } = useLoginBonus(seasonId);
  const [justClaimed,    setJustClaimed]    = useState(false);
  const [showClaimAnim,  setShowClaimAnim]  = useState(false);
  const [claimedReward,  setClaimedReward]  = useState<DayReward | null>(null);
  const [claimResult,    setClaimResult]    = useState<ClaimResponse | null>(null);

  const handleClaim = useCallback(async () => {
    if (!data?.canClaimToday || isClaiming) return;
    const todayReward = data.todayReward;
    const result = await claim();
    if (result?.success) {
      setJustClaimed(true);
      setClaimedReward(todayReward);
      setClaimResult(result);
      setShowClaimAnim(true);
    }
  }, [data, isClaiming, claim]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-40 rounded-xl" style={{ background: "rgba(124,58,237,0.1)" }} />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="rounded-[18px] h-28" style={{ background: "rgba(124,58,237,0.07)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center rounded-[20px] border"
        style={{ background: CARD, borderColor: BORDER }}>
        <span className="text-4xl">📅</span>
        <p className="text-[14px] font-black" style={{ color: TEXT }}>No login bonus data</p>
        <p className="text-[12px]" style={{ color: MUTED }}>Check back once a season is active</p>
      </div>
    );
  }

  const { currentStreak, canClaimToday, nextClaimAt, weekRewards, milestones,
          totalXpEarned, totalCoinsEarned, streakFreezes } = data;

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>
              Daily Login Bonus
            </p>
            <h2 className="text-[22px] font-black" style={{ color: TEXT }}>
              {currentStreak === 0 ? "Start your streak!" :
               currentStreak === 1 ? "1 Day Strong 🔥" :
               `${currentStreak} Days Strong 🔥`}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
              Log in daily to earn bigger rewards
            </p>
          </div>

          {/* Streak badge */}
          <div className="flex items-center gap-2 rounded-2xl border px-4 py-2.5 flex-shrink-0"
            style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.25)" }}>
            <span className="text-[20px]">🔥</span>
            <div>
              <p className="text-[18px] font-black leading-none" style={{ color: TEXT }}>{currentStreak}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: P }}>day streak</p>
            </div>
          </div>
        </div>

        {/* ── 7-day reward track ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MUTED }}>
            This Week's Rewards
          </p>
          <div className="grid grid-cols-7 gap-2">
            {weekRewards.map((day) => (
              <DayCard
                key={day.daySlot}
                day={day}
                isToday={day.state === "today"}
                justClaimed={justClaimed && day.state === "today"}
              />
            ))}
          </div>
        </div>

        {/* ── Claim button / countdown ── */}
        {canClaimToday && !justClaimed ? (
          <button onClick={handleClaim} disabled={isClaiming}
            className="w-full py-4 rounded-2xl text-[15px] font-black text-white transition-all flex items-center justify-center gap-2"
            style={{
              background: isClaiming ? "rgba(239,57,118,0.3)" : `linear-gradient(135deg, ${P}, #c0305f)`,
              boxShadow:  isClaiming ? "none" : "0 8px 28px rgba(239,57,118,0.4)",
              opacity:    isClaiming ? 0.7 : 1,
            }}>
            {isClaiming ? (
              <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Claiming…</>
            ) : (
              <><span className="text-[20px]">{data.todayReward?.icon}</span>
                Claim Today's Reward — {data.todayReward?.rewardLabel}</>
            )}
          </button>
        ) : justClaimed ? (
          <div className="w-full py-3.5 rounded-2xl text-[14px] font-black flex items-center justify-center gap-2 border"
            style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)", color: "#4ade80" }}>
            ✓ Today's reward claimed!
            {nextClaimAt && (
              <span className="font-bold" style={{ color: "rgba(34,197,94,0.7)" }}>
                · Next in {formatCountdown(nextClaimAt)}
              </span>
            )}
          </div>
        ) : (
          <div className="w-full py-3.5 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2 border"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER, color: MUTED }}>
            ⏰ Next reward in {nextClaimAt ? formatCountdown(nextClaimAt) : "–"}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total XP",   value: totalXpEarned.toLocaleString(),    icon: "⚡", color: P       },
            { label: "Coins",      value: totalCoinsEarned.toLocaleString(), icon: "💰", color: "#fbbf24"},
            { label: "Freezes",    value: String(streakFreezes),             icon: "🛡️", color: "#38bdf8"},
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-[14px] border p-3.5"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px]">{s.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
                  {s.label}
                </span>
              </div>
              <span className="text-[20px] font-black" style={{ color: TEXT }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Inventory note for item rewards ── */}
        <div className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
          style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
          <span className="text-[18px]">🎒</span>
          <p className="text-[11px]" style={{ color: MUTED }}>
            Badges, mystery boxes and gifts are automatically added to your
            <span className="font-black ml-1" style={{ color: TEXT }}>Inventory</span> when claimed.
          </p>
        </div>

        {/* ── Streak milestones ── */}
        {milestones.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>
              Streak Milestones
            </p>
            {milestones.map((m) => (
              <MilestoneRow key={m.id} milestone={m} />
            ))}
          </div>
        )}

        {/* VIP upsell */}
        {!isVip && (
          <div className="relative rounded-[20px] overflow-hidden border p-5"
            style={{ background: GRAD, borderColor: "rgba(124,58,237,0.3)" }}>
            <div className="absolute -right-4 -bottom-4 text-[80px] opacity-10 pointer-events-none select-none">💎</div>
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-1">VIP Bonus</p>
              <h3 className="text-[16px] font-black text-white mb-2">2× Rewards on Every Login</h3>
              <p className="text-[12px] text-white/80 mb-3">
                VIP members earn double XP and coins from daily login rewards.
              </p>
              <button className="bg-white rounded-full px-5 py-2 text-[12px] font-black hover:opacity-90 transition-all"
                style={{ color: V }}>
                Upgrade to VIP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Claim animation */}
      {showClaimAnim && claimedReward && (
        <ClaimAnim
          reward={claimedReward}
          onDone={() => setShowClaimAnim(false)}
        />
      )}
    </>
  );
}