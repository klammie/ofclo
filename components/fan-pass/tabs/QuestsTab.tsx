"use client";

import { useState, useEffect } from "react";
import type { Quest, QuestCategory, DashboardUser } from "@/lib/types";

// ─── Theme (matches original fanpass design) ──────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V}, ${P})`;

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const CATEGORY_LABELS: Record<QuestCategory, string> = {
  daily: "Daily", weekly: "Weekly", season: "Season",
};
const CATEGORY_ICONS: Record<QuestCategory, string> = {
  daily: "⚡", weekly: "📅", season: "🏆",
};
// NOTE: weekly/season tabs removed — Fan Pass quests are daily-only now,
// rotating automatically each day via the API route's deterministic shuffle.

function xpColor(xp: number): string {
  if (xp >= 150) return "#fbbf24";
  if (xp >= 100) return "#a78bfa";
  if (xp >= 50)  return "#38bdf8";
  return P;
}

// ─── Battle pass track node ───────────────────────────────────────────────────
function TrackNode({
  quest, isLast, isVip,
}: {
  quest: Quest; isLast: boolean; isVip: boolean;
}) {
  const isDone      = quest.status === "completed";
  const isActive    = !isDone && quest.progress > 0;
  const effectiveXp = isVip && quest.isVipBonus ? quest.xpReward * 2 : quest.xpReward;
  const nodeColor   = xpColor(effectiveXp);

  return (
    <div className="flex items-start gap-4">
      {/* ── Node + vertical connector ── */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 44 }}>
        <div
          className="relative size-11 rounded-full flex items-center justify-center text-[18px] border-2 z-10 transition-all duration-300"
          style={{
            background:  isDone  ? `${nodeColor}25`  : isActive ? `${nodeColor}15` : "rgba(255,255,255,0.04)",
            borderColor: isDone  ? nodeColor          : isActive ? `${nodeColor}80` : "rgba(255,255,255,0.1)",
            boxShadow:   isDone  ? `0 0 18px ${nodeColor}55` : isActive ? `0 0 10px ${nodeColor}35` : "none",
          }}
        >
          {isDone ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={nodeColor} strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <span>{quest.icon}</span>
          )}
          {isActive && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: nodeColor }} />
          )}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-1 min-h-[32px] rounded-full"
            style={{ background: isDone ? `${nodeColor}55` : "rgba(255,255,255,0.08)" }} />
        )}
      </div>

      {/* ── Quest card ── */}
      <div
        className="flex-1 rounded-3xl border mb-4 overflow-hidden transition-all duration-200"
        style={{
          background:  isDone  ? `${nodeColor}08`            : isActive ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          borderColor: isDone  ? `${nodeColor}35`            : isActive ? `${nodeColor}45`         : "rgba(255,255,255,0.07)",
          opacity:     isDone  ? 0.8                          : 1,
        }}
      >
        {/* Active top accent */}
        {isActive && !isDone && (
          <div className="h-[2px]" style={{ background: GRAD }} />
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title + VIP badge */}
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className={cn(
                  "text-[13px] font-black",
                  isDone ? "line-through opacity-50 text-white" : "text-white"
                )}>
                  {quest.title}
                </p>
                {quest.isVipBonus && (
                  <span className="text-[8px] font-black rounded-full px-1.5 py-0.5"
                    style={{
                      background: "rgba(251,191,36,0.15)",
                      border:     "1px solid rgba(251,191,36,0.3)",
                      color:      "#fbbf24",
                    }}>
                    {isVip ? "VIP 2×" : "VIP"}
                  </span>
                )}
              </div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {quest.description}
              </p>
            </div>

            {/* Reward pills */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-black rounded-full px-2.5 py-1"
                style={{
                  background: `${nodeColor}18`,
                  border:     `1px solid ${nodeColor}35`,
                  color:      nodeColor,
                }}>
                +{effectiveXp} XP
              </span>
              {quest.coinReward > 0 && (
                <span className="text-[10px] font-black rounded-full px-2 py-0.5"
                  style={{
                    background: "rgba(251,191,36,0.1)",
                    border:     "1px solid rgba(251,191,36,0.2)",
                    color:      "#fbbf24",
                  }}>
                  +{quest.coinReward} 💰
                </span>
              )}
            </div>
          </div>

          {/* Progress bar for multi-step quests */}
          {!isDone && quest.target > 1 && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold"
                  style={{ color: "rgba(255,255,255,0.35)" }}>
                  {quest.current} / {quest.target}
                </span>
                <span className="text-[10px] font-black" style={{ color: nodeColor }}>
                  {quest.progress}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:      `${quest.progress}%`,
                    background: `linear-gradient(90deg, ${P}, ${nodeColor})`,
                    boxShadow:  `0 0 6px ${nodeColor}50`,
                  }} />
              </div>
            </div>
          )}

          {/* Completed badge */}
          {isDone && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <div className="size-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                style={{ background: nodeColor }}>
                ✓
              </div>
              <span className="text-[10px] font-black" style={{ color: nodeColor }}>
                Completed · +{effectiveXp} XP earned
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface QuestsTabProps {
  seasonId: number | string;
  user:     DashboardUser;
}

export default function QuestsTab({ seasonId, user }: QuestsTabProps) {
  const [quests,    setQuests]    = useState<Quest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [rotatesOn, setRotatesOn] = useState<string | null>(null);

  // Fetch today's rotating daily quests + the user's live progress, merged.
  useEffect(() => {
    if (!seasonId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/fan-pass/season/tasks?seasonId=${seasonId}`).then((r) => r.json()),
      fetch(`/api/fan-pass/season/quest-progress?seasonId=${seasonId}`).then((r) => r.json()).catch(() => ({ progress: {} })),
    ])
      .then(([taskData, progressData]) => {
        const rawTasks   = taskData.tasks ?? [];
        const progressMap = progressData.progress ?? {};
        setRotatesOn(taskData.rotatesOn ?? null);

        // Route returns only today's rotated subset — all of them are "daily"
        const mapped: Quest[] = rawTasks.map((t: any) => {
          const liveProgress = progressMap[t.id];
          const current = liveProgress?.current ?? 0;
          const target  = liveProgress?.target  ?? (parseInt((t.title.match(/\d+/) ?? ["1"])[0], 10) || 1);
          const isDone  = liveProgress?.isCompleted ?? false;

          return {
            id:          String(t.id),
            title:       t.title       ?? t.label ?? "Quest",
            description: t.description ?? "",
            icon:        t.icon        ?? "🎯",
            category:    "daily" as QuestCategory,
            xpReward:    Number(t.xpReward)   || 0,
            coinReward:  Number(t.coinReward)  || 0,
            isVipBonus:  t.tier === "premium",
            status:      isDone ? "completed" as const : "active" as const,
            progress:    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
            current,
            target,
            expiresAt:   null,
          };
        });

        setQuests(mapped);
      })
      .catch((e) => {
        console.error("[QuestsTab] fetch error:", e);
        setQuests([]);
      })
      .finally(() => setLoading(false));
  }, [seasonId]);

  const completedCount = quests.filter((q) => q.status === "completed").length;
  const totalCount     = quests.length;
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalXpLeft = quests
    .filter((q) => q.status !== "completed")
    .reduce((s, q) => s + (user.isVip && q.isVipBonus ? q.xpReward * 2 : q.xpReward), 0);

  // Sort: in-progress → not started → completed
  const sorted = [...quests].sort((a, b) => {
    const rank = (q: Quest) =>
      q.status === "completed" ? 2 : q.progress > 0 ? 0 : 1;
    return rank(a) - rank(b);
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="size-11 rounded-full flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.1)" }} />
            <div className="flex-1 rounded-[18px] h-20"
              style={{ background: "rgba(124,58,237,0.07)" }} />
          </div>
        ))}
      </div>
    );
  }

  const active    = sorted.filter((q) => q.status !== "completed");
  const completed = sorted.filter((q) => q.status === "completed");

  // Countdown to next rotation (midnight UTC)
  const nextRotation = (() => {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const diffMs = tomorrow.getTime() - now.getTime();
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    return `${h}h ${m}m`;
  })();

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header: Daily quests + rotation countdown ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">⚡</span>
          <p className="text-[14px] font-black text-white">Daily Quests</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
          <span className="text-[10px]">🔄</span>
          <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
            New quests in {nextRotation}
          </span>
        </div>
      </div>

      {/* ── Progress summary ── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          <span className="text-white font-black">{completedCount}</span> of{" "}
          <span className="text-white font-black">{totalCount}</span>{" "}
          daily quests done
          {totalXpLeft > 0 && (
            <span className="ml-2 font-bold" style={{ color: P }}>
              · {totalXpLeft.toLocaleString()} XP left
            </span>
          )}
        </p>
        {user.isVip && (
          <span className="text-[9px] font-black rounded-full px-2 py-0.5"
            style={{
              color:       P,
              background:  "rgba(239,57,118,0.1)",
              border:      "1px solid rgba(239,57,118,0.25)",
            }}>
            💎 VIP 2× Active
          </span>
        )}
      </div>

      {/* ── Track progress bar with checkpoints ── */}
      <div>
        <div className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width:      `${pct}%`,
              background: pct === 100
                ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                : `linear-gradient(90deg,${P},${V})`,
              boxShadow:  pct === 100
                ? "0 0 12px rgba(251,191,36,0.5)"
                : "0 0 8px rgba(239,57,118,0.4)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
        {/* Checkpoint markers */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div key={mark} className="flex flex-col items-center gap-0.5">
              <div className="size-1 rounded-full"
                style={{ background: pct >= mark ? P : "rgba(255,255,255,0.15)" }} />
              <span className="text-[8px] font-bold"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                {mark}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🎯</span>
          <p className="text-[14px] font-black text-white">
            No {CATEGORY_LABELS[activeCategory].toLowerCase()} quests yet
          </p>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Check back soon — new quests drop regularly
          </p>
        </div>
      )}

      {/* ── Battle pass track — active quests ── */}
      {active.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-4"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            Quest Track
          </p>
          {active.map((q, i) => (
            <TrackNode
              key={q.id}
              quest={q}
              isLast={i === active.length - 1 && completed.length === 0}
              isVip={user.isVip}
            />
          ))}
        </div>
      )}

      {/* ── Completed quests ── */}
      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.14em]"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Completed
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>
          {completed.map((q, i) => (
            <TrackNode
              key={q.id}
              quest={q}
              isLast={i === completed.length - 1}
              isVip={user.isVip}
            />
          ))}
        </div>
      )}

      {/* ── All done celebration ── */}
      {pct === 100 && totalCount > 0 && (
        <div
          className="rounded-3xl border p-5 text-center"
          style={{
            background:  "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))",
            borderColor: "rgba(251,191,36,0.3)",
          }}
        >
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-[15px] font-black text-white">
            All {CATEGORY_LABELS[activeCategory]} Quests Done!
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Come back tomorrow for new quests
          </p>
        </div>
      )}
    </div>
  );
}