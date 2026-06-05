"use client";

import type { LeaderboardEntry } from "@/lib/types";

function levelBadgeColor(level: number): string {
  if (level >= 50) return "#fbbf24"; // legendary gold
  if (level >= 35) return "#a78bfa"; // epic purple
  if (level >= 20) return "#38bdf8"; // rare blue
  if (level >= 10) return "#4ade80"; // green
  if (level >= 5)  return "#7c3aed"; // purple
  return "#94a3b8";                  // common grey
}

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function Avatar({ entry }: { entry: LeaderboardEntry }) {
  const color = levelBadgeColor(entry.level);
  const initials = entry.displayName.slice(0, 2).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div
        className="size-10 rounded-full flex items-center justify-center text-[12px] font-black border-2 overflow-hidden"
        style={{
          borderColor: entry.isCurrentUser ? "#ef3976" : color + "80",
          background: entry.isCurrentUser ? "rgba(239,57,118,0.2)" : "rgba(255,255,255,0.05)",
        }}
      >
        {entry.avatarUrl
          ? <img src={entry.avatarUrl} alt={entry.displayName} className="size-full object-cover" />
          : <span style={{ color }}>{initials}</span>
        }
      </div>
      <div
        className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full flex items-center justify-center text-[7px] font-black"
        style={{ background: color, color: "#221016" }}
      >
        {entry.level}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[14px] border px-4 py-3 transition-all duration-150",
        entry.isCurrentUser
          ? "border-[rgba(239,57,118,0.5)] bg-[rgba(239,57,118,0.1)] shadow-[0_0_12px_rgba(239,57,118,0.12)]"
          : isTop3
          ? "border-white/10 bg-white/4"
          : "border-white/4 bg-white/2 hover:border-white/10"
      )}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {RANK_ICONS[entry.rank]
          ? <span className="text-[18px]">{RANK_ICONS[entry.rank]}</span>
          : <span className="text-[13px] font-black text-white/30">#{entry.rank}</span>
        }
      </div>

      <Avatar entry={entry} />

      {/* Name + stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={cn(
            "text-[13px] font-bold truncate",
            entry.isCurrentUser ? "text-[#ef3976]" : "text-white"
          )}>
            {entry.isCurrentUser ? "You" : entry.displayName}
          </p>
          {entry.isVip && (
            <span className="bg-[rgba(239,57,118,0.15)] border border-[rgba(239,57,118,0.3)] rounded-full px-1.5 py-px text-[7px] font-black text-[#ef3976] uppercase">
              VIP
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-white/35">
            {entry.totalXp.toLocaleString()} XP
          </span>
          <span className="text-white/15 text-[9px]">·</span>
          <span className="text-[9px] text-white/35">
            🔥 {entry.currentStreak}d streak
          </span>
        </div>
      </div>

      {/* XP bar */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-20">
        <span className="text-[10px] font-black text-white/50">
          Lvl {entry.level}
        </span>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (entry.totalXp % 500) / 5)}%`,
              background: entry.isCurrentUser
                ? "linear-gradient(90deg, #ef3976, #ff6b9d)"
                : levelBadgeColor(entry.level),
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface LeaderboardTabProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export default function LeaderboardTab({ entries, currentUserId }: LeaderboardTabProps) {
  const currentUser = entries.find((e) => e.isCurrentUser);
  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <div className="flex flex-col gap-4">
      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[top3[1], top3[0], top3[2]].map((entry, i) => {
          if (!entry) return <div key={i} />;
          const podiumHeights = ["h-20", "h-28", "h-16"];
          const isFirst = entry.rank === 1;
          const color = levelBadgeColor(entry.level);

          return (
            <div key={entry.userId} className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="size-12 rounded-full flex items-center justify-center text-[14px] font-black border-2 overflow-hidden"
                  style={{ borderColor: color, background: color + "20" }}
                >
                  {entry.avatarUrl
                    ? <img src={entry.avatarUrl} className="size-full object-cover" />
                    : <span style={{ color }}>{entry.displayName.slice(0, 2).toUpperCase()}</span>
                  }
                </div>
                <span className="text-[9px] font-bold text-white/60 truncate max-w-17.5 text-center">
                  {entry.displayName}
                </span>
                <span className="text-[16px]">{RANK_ICONS[entry.rank]}</span>
              </div>
              <div
                className={cn("w-full rounded-t-[10px] flex items-end justify-center pb-2", podiumHeights[i])}
                style={{ background: `linear-gradient(to top, ${color}30, ${color}10)`, border: `1px solid ${color}30` }}
              >
                <span className="text-[10px] font-black" style={{ color }}>
                  {(entry.totalXp / 1000).toFixed(1)}k XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Your rank callout (if not in top 10) */}
      {currentUser && currentUser.rank > 10 && (
        <div className="rounded-[14px] border border-[rgba(239,57,118,0.35)] bg-[rgba(239,57,118,0.08)] px-4 py-3 flex items-center gap-3">
          <span className="text-[20px]">📍</span>
          <div>
            <p className="text-[12px] font-bold text-white">Your rank: #{currentUser.rank}</p>
            <p className="text-[10px] text-white/40">Keep earning XP to climb the leaderboard</p>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 mb-1">Rankings</p>
        {entries.map((entry) => (
          <LeaderboardRow key={entry.userId} entry={entry} />
        ))}
      </div>

      <p className="text-[10px] text-white/20 text-center">
        Leaderboard resets at the end of each season · Top 3 earn bonus rewards
      </p>
    </div>
  );
}