"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeeklyTaskBundle, RewardWindow, AssignedTask, WindowedReward } from "@/lib/types";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD = "#1a1635";
const SURF = "#13112b";
const BORDER = "rgba(124,58,237,0.2)";
const TEXT = "#f0eaff";
const MUTED = "rgba(240,234,255,0.5)";

const RARITY_COLORS = {
  common:    "#94a3b8",
  rare:      "#38bdf8",
  epic:      "#a78bfa",
  legendary: "#fbbf24",
};

// ─── Time until week resets ───────────────────────────────────────────────────

function useWeekCountdown(weekEndDate: string): string {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(weekEndDate).getTime() - Date.now();
      if (diff <= 0) { setLabel("Resetting…"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(`${h}h ${m}m left`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [weekEndDate]);
  return label;
}

// ─── Weekly task card ─────────────────────────────────────────────────────────

function TaskCard({ task, onComplete, isCompleting }: {
  task: AssignedTask;
  onComplete: (taskId: number) => void;
  isCompleting: boolean;
}) {
  const isLocked   = task.tier === "premium" && task.progressLabel === "VIP Only";
  const isStreak   = task.type === "streak";

  return (
    <div className="rounded-[16px] border flex flex-col gap-3 overflow-hidden transition-all"
      style={{
        background: task.isCompleted ? "rgba(34,197,94,0.05)" : CARD,
        borderColor: task.isCompleted ? "rgba(34,197,94,0.3)" : isLocked ? "rgba(251,191,36,0.2)" : BORDER,
      }}>
      {/* Top tier stripe */}
      {task.tier === "premium" && (
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #fbbf24, #ef3976)" }} />
      )}

      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
            style={{ background: task.isCompleted ? "rgba(34,197,94,0.12)" : "rgba(124,58,237,0.1)" }}>
            {task.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-black" style={{ color: TEXT }}>{task.title}</p>
              {task.tier === "premium" && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>⭐ Premium</span>
              )}
              {task.isDefault && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(251,152,36,0.15)", color: "#fb923c" }}>🔥 Streak</span>
              )}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{task.description}</p>
          </div>
          {/* Rewards */}
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <span className="text-[10px] font-black" style={{ color: "#a78bfa" }}>+{task.xpReward} XP</span>
            {task.coinReward > 0 && <span className="text-[10px] font-black" style={{ color: "#fbbf24" }}>+{task.coinReward} 🪙</span>}
          </div>
        </div>

        {/* Progress bar (streak task) */}
        {isStreak && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold" style={{ color: MUTED }}>{task.progressLabel}</span>
              <span className="text-[10px] font-bold" style={{ color: "#fb923c" }}>{task.progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.15)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${task.progress}%`, background: "linear-gradient(90deg, #fb923c, #fbbf24)" }} />
            </div>
            <div className="flex justify-between">
              {[1,2,3,4,5,6,7].map((d) => (
                <div key={d} className="size-4 rounded-full flex items-center justify-center text-[8px]"
                  style={{
                    background: d <= Math.floor(task.progress / 100 * 7) ? "#fb923c" : "rgba(124,58,237,0.12)",
                    color: d <= Math.floor(task.progress / 100 * 7) ? "#fff" : MUTED,
                  }}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        {task.isCompleted ? (
          <div className="flex items-center gap-2 py-2 rounded-xl px-3"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <span style={{ color: "#4ade80" }}>✓</span>
            <span className="text-[11px] font-black" style={{ color: "#4ade80" }}>Completed!</span>
          </div>
        ) : isLocked ? (
          <div className="flex items-center gap-2 py-2 rounded-xl px-3 border"
            style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }}>
            <span className="text-[13px]">🔒</span>
            <span className="text-[11px] font-bold" style={{ color: "#fbbf24" }}>Upgrade to VIP to unlock</span>
          </div>
        ) : !isStreak ? (
          <button onClick={() => onComplete(task.taskId)} disabled={isCompleting}
            className="w-full py-2 rounded-xl text-[12px] font-black text-white transition-all"
            style={{ background: GRAD, opacity: isCompleting ? 0.6 : 1 }}>
            {isCompleting ? "Completing…" : "Mark Complete"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Windowed reward track ────────────────────────────────────────────────────

function RewardTrack({ window: rw, isVip, onClaim }: {
  window: RewardWindow;
  isVip: boolean;
  onClaim: (rewardId: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* XP progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black" style={{ color: TEXT }}>Level {rw.userLevel}</span>
          <span className="text-[11px] font-bold" style={{ color: MUTED }}>{rw.xpToNextLevel} XP to next level</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.15)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${rw.progressPercent}%`, background: GRAD }} />
        </div>
      </div>

      {/* 5-milestone track */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5"
          style={{ background: "rgba(124,58,237,0.15)" }} />

        <div className="flex flex-col gap-2">
          {rw.rewards.map((wr, i) => {
            const r = wr.reward;
            const rarityColor = RARITY_COLORS[r.rarity as keyof typeof RARITY_COLORS] ?? "#94a3b8";
            const isCurrent  = wr.state === "current";
            const isPast     = wr.state === "past";
            const isUpcoming = wr.state === "upcoming";
            const isVipReward = r.isVipOnly;
            const canClaim   = isPast && !wr.isClaimed && (!isVipReward || isVip);

            return (
              <div key={r.id} className={`flex items-center gap-4 relative transition-all duration-300 ${isCurrent ? "scale-[1.02]" : ""}`}>
                {/* Level node */}
                <div className="flex-shrink-0 size-16 rounded-2xl flex flex-col items-center justify-center border-2 z-10"
                  style={{
                    background: isCurrent ? GRAD : isPast ? "rgba(34,197,94,0.1)" : CARD,
                    borderColor: isCurrent ? "transparent" : isPast ? "rgba(34,197,94,0.4)" : BORDER,
                    boxShadow: isCurrent ? `0 0 20px rgba(124,58,237,0.4)` : "none",
                  }}>
                  <span className="text-[20px]">{r.icon}</span>
                  <span className="text-[9px] font-black" style={{ color: isCurrent ? "#fff" : MUTED }}>Lvl {r.level}</span>
                </div>

                {/* Reward card */}
                <div className="flex-1 rounded-[14px] border px-4 py-3 flex items-center gap-3"
                  style={{
                    background: isCurrent ? "rgba(124,58,237,0.1)" : CARD,
                    borderColor: isCurrent ? "rgba(124,58,237,0.4)" : BORDER,
                    opacity: isUpcoming ? 0.7 : 1,
                  }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12px] font-black" style={{ color: TEXT }}>{r.label}</p>
                      {/* Rarity badge */}
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full capitalize"
                        style={{ background: rarityColor + "18", color: rarityColor, border: `1px solid ${rarityColor}30` }}>
                        {r.rarity}
                      </span>
                      {/* VIP badge */}
                      {r.isVipOnly && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>⭐ VIP</span>
                      )}
                      {/* Mystery box badge */}
                      {r.rewardType === "mystery_box" && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>🎁 Mystery</span>
                      )}
                    </div>
                    {r.description && <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{r.description}</p>}
                  </div>

                  {/* State indicator / claim */}
                  <div className="flex-shrink-0">
                    {wr.isClaimed ? (
                      <div className="size-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                        <span style={{ color: "#4ade80", fontSize: 12 }}>✓</span>
                      </div>
                    ) : canClaim ? (
                      <button onClick={() => onClaim(r.id)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white"
                        style={{ background: GRAD }}>
                        Claim
                      </button>
                    ) : isVipReward && !isVip ? (
                      <span className="text-[11px]" style={{ color: "#fbbf24" }}>🔒 VIP</span>
                    ) : isUpcoming ? (
                      <span className="text-[10px]" style={{ color: "rgba(240,234,255,0.25)" }}>Locked</span>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-black animate-pulse" style={{ color: V }}>Current</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT — WeeklyTasksPanel ──────────────────────────────────────────

export function WeeklyTasksPanel() {
  const [bundle, setBundle]       = useState<WeeklyTaskBundle | null>(null);
  const [rewardWindow, setWindow] = useState<RewardWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [claiming, setClaiming]   = useState<number | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const countdown = useWeekCountdown(bundle?.weekEndDate ?? new Date().toISOString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, rewardsRes] = await Promise.all([
        fetch("/api/fan-pass/tasks"),
        fetch("/api/fan-pass/rewards"),
      ]);
      if (tasksRes.ok) {
        const { bundle } = await tasksRes.json();
        setBundle(bundle);
      }
      if (rewardsRes.ok) {
        const { window } = await rewardsRes.json();
        setWindow(window);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComplete = useCallback(async (taskId: number) => {
    setCompleting(taskId);
    try {
      const res = await fetch("/api/fan-pass/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompleting(null);
    }
  }, [fetchData]);

  const handleClaim = useCallback(async (rewardId: number) => {
    setClaiming(rewardId);
    try {
      const res = await fetch("/api/fan-pass/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClaiming(null);
    }
  }, [fetchData]);

  if (isLoading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-[16px]" style={{ background: CARD }} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>
      {error && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span>
          <p className="text-[12px] font-bold flex-1" style={{ color: P }}>{error}</p>
          <button onClick={() => setError(null)} style={{ color: MUTED }}>✕</button>
        </div>
      )}

      {/* Weekly tasks */}
      {bundle && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-black" style={{ color: TEXT }}>Weekly Tasks</h3>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: "rgba(124,58,237,0.1)", color: V }}>
              🔄 {countdown}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {bundle.tasks.map((task) => (
              <TaskCard key={task.id} task={task}
                onComplete={handleComplete}
                isCompleting={completing === task.taskId} />
            ))}
          </div>
        </div>
      )}

      {/* Reward window */}
      {rewardWindow && (
        <div className="flex flex-col gap-4">
          <h3 className="text-[15px] font-black" style={{ color: TEXT }}>Reward Track</h3>
          <RewardTrack window={rewardWindow} isVip={false} onClaim={handleClaim} />
        </div>
      )}
    </div>
  );
}