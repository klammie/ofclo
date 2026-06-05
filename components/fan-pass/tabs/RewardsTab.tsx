"use client";

import { useState } from "react";
import type { PassReward, DashboardUser, PassLevel } from "@/lib/types";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

interface RewardsTabProps {
  rewards: PassReward[];
  passLevel: PassLevel;
  user: DashboardUser;
}

// Group rewards by level
function groupByLevel(rewards: PassReward[]): Map<number, { free?: PassReward; vip?: PassReward }> {
  const map = new Map<number, { free?: PassReward; vip?: PassReward }>();
  for (const r of rewards) {
    const existing = map.get(r.level) ?? {};
    if (r.tier === "free") existing.free = r;
    else existing.vip = r;
    map.set(r.level, existing);
  }
  return map;
}

function RewardCard({
  reward,
  userLevel,
  isVip,
  side,
}: {
  reward?: PassReward;
  userLevel: number;
  isVip: boolean;
  side: "free" | "vip";
}) {
  if (!reward) {
    return <div className="w-[calc(50%-28px)] h-21" />;
  }

  const isLocked = !reward.isAvailable || (reward.isVipOnly && !isVip);
  const isClaimed = reward.claimed;
  const isReady = reward.isAvailable && !isClaimed && (!reward.isVipOnly || isVip);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-3xl border p-3 w-[calc(50%-28px)] transition-all duration-200",
        isClaimed && "border-green-500/30 bg-green-500/6",
        isReady && side === "free" && "border-white/20 bg-white/4 hover:border-white/30",
        isReady && side === "vip" && "border-[rgba(239,57,118,0.5)] bg-[rgba(239,57,118,0.1)] shadow-[0_0_12px_rgba(239,57,118,0.15)] hover:shadow-[0_0_18px_rgba(239,57,118,0.25)]",
        isLocked && "border-white/4 bg-white/2 opacity-40 grayscale"
      )}
    >
      {/* status badge */}
      {isClaimed && (
        <span className="absolute -top-2 -right-2 size-5 rounded-full bg-green-500 flex items-center justify-center text-[9px] font-black text-white z-10">
          ✓
        </span>
      )}
      {isReady && side === "vip" && (
        <span className="absolute -top-2 -right-2 bg-[#ef3976] text-white text-[7px] font-black rounded-full px-1.5 py-0.5 z-10 uppercase tracking-wider animate-pulse">
          Claim
        </span>
      )}
      {reward.isVipOnly && isLocked && (
        <span className="absolute -top-2 -right-2 text-[#ef3976] text-[13px] z-10">🔒</span>
      )}

      <div
        className={cn(
          "size-10 rounded-2xl flex items-center justify-center text-[20px]",
          isClaimed ? "bg-green-500/15" : side === "vip" ? "bg-[rgba(239,57,118,0.2)]" : "bg-white/6"
        )}
      >
        {reward.icon}
      </div>

      <p className={cn(
        "text-[10px] font-bold text-center leading-tight",
        isClaimed ? "text-green-400" : side === "vip" ? "text-[#ef3976]" : "text-white/60"
      )}>
        {reward.label}
      </p>
    </div>
  );
}

export default function RewardsTab({ rewards, passLevel, user }: RewardsTabProps) {
  const grouped = groupByLevel(rewards);
  const levels = Array.from(grouped.keys()).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4">
      {/* Track header */}
      <div className="flex justify-between px-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 w-[calc(50%-28px)] text-center">
          Free Track
        </span>
        <div className="w-14" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ef3976] w-[calc(50%-28px)] text-center">
          VIP Track
        </span>
      </div>

      {/* Reward rows */}
      <div className="relative flex flex-col gap-6">
        {/* Centre line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[rgba(239,57,118,0.1)]" />

        {levels.map((lvl) => {
          const pair = grouped.get(lvl)!;
          const isCurrentLevel = lvl === passLevel.level;
          const isPassed = lvl < passLevel.level;

          return (
            <div key={lvl} className="flex items-center justify-between gap-2">
              {/* Free side */}
              <RewardCard
                reward={pair.free}
                userLevel={passLevel.level}
                isVip={user.isVip}
                side="free"
              />

              {/* Level pill */}
              <div
                className={cn(
                  "z-10 shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-black border-4 transition-all",
                  isPassed && "bg-[rgba(239,57,118,0.6)] border-[#221016] text-white",
                  isCurrentLevel && "bg-[#ef3976] border-[#221016] text-white scale-110",
                  !isPassed && !isCurrentLevel && "bg-[#2e151f] border-[#3a1a25] text-white/25"
                )}
                style={isCurrentLevel ? { boxShadow: "0 0 0 6px rgba(239,57,118,0.2)" } : undefined}
              >
                {lvl}
              </div>

              {/* VIP side */}
              <RewardCard
                reward={pair.vip}
                userLevel={passLevel.level}
                isVip={user.isVip}
                side="vip"
              />
            </div>
          );
        })}
      </div>

      {/* VIP upsell if not vip */}
      {!user.isVip && (
        <div className="mt-4 rounded-3xl border border-[rgba(239,57,118,0.3)] bg-[rgba(239,57,118,0.06)] p-4 flex items-center gap-4">
          <span className="text-[28px]">💎</span>
          <div className="flex-1">
            <p className="text-[12px] font-black text-white">Unlock all VIP rewards</p>
            <p className="text-[10px] text-white/40 mt-0.5">Purchase the VIP Pass to claim the right track</p>
          </div>
          <button className="bg-[#ef3976] text-white rounded-full px-4 py-2 text-[11px] font-black
                             hover:bg-[#ef3976]/90 active:scale-[0.97] transition-all shrink-0">
            Go VIP
          </button>
        </div>
      )}
    </div>
  );
}