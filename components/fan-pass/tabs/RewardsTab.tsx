"use client";

// components/fans-pass/tabs/RewardsTab.tsx

import { useState, useEffect, useCallback } from "react";
import type { PassReward, DashboardUser, PassLevel } from "@/lib/types";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

interface FeaturedCreator {
  userId:    string;
  name:      string;
  username:  string;
  avatarUrl: string | null;
}

interface RewardsTabProps {
  rewards:   PassReward[];
  passLevel: PassLevel;
  user:      DashboardUser;
  seasonId:  number;
  featuredCreator?: FeaturedCreator | null;
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

// ─── Claim animation overlay ──────────────────────────────────────────────────
function ClaimAnim({ reward, featuredMedia, onDone }: {
  reward: PassReward;
  featuredMedia: { mediaUrl: string | null; mediaType: string | null; thumbnailUrl: string | null } | null;
  onDone: () => void;
}) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);

  const isExclusive = reward.rewardType === "exclusive_content" && featuredMedia;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="flex flex-col items-center gap-4 text-center"
        style={{ animation: "claimPop 0.5s cubic-bezier(0.175,0.885,0.32,1.6) forwards" }}>

        {isExclusive ? (
          <>
            <div className="rounded-2xl overflow-hidden border-2 max-w-[280px]"
              style={{ borderColor: "#fbbf24", boxShadow: "0 0 40px rgba(251,191,36,0.5)" }}>
              {featuredMedia.mediaType === "video" ? (
                <video src={featuredMedia.mediaUrl ?? undefined} poster={featuredMedia.thumbnailUrl ?? undefined}
                  className="w-full" autoPlay muted loop style={{ maxHeight: 320, objectFit: "cover" }} />
              ) : (
                <img src={featuredMedia.mediaUrl ?? featuredMedia.thumbnailUrl ?? ""} alt=""
                  className="w-full" style={{ maxHeight: 320, objectFit: "cover" }} />
              )}
            </div>
            <p className="text-[14px] font-black text-white">🌟 Exclusive Content Unlocked!</p>
          </>
        ) : (
          <div className="text-[72px]" style={{ filter: "drop-shadow(0 0 24px #fbbf24)" }}>
            {reward.icon}
          </div>
        )}

        <div className="rounded-2xl border px-8 py-5"
          style={{ background: "#1a1635", borderColor: "rgba(251,191,36,0.4)", boxShadow: "0 0 40px rgba(251,191,36,0.3)" }}>
          <p className="text-[13px] font-black uppercase tracking-widest mb-1" style={{ color: "#fbbf24" }}>
            Level {reward.level} Reward
          </p>
          <p className="text-[22px] font-black text-white">{reward.label}</p>
          <p className="text-[11px] mt-1.5 font-bold text-green-400">✓ Added to your inventory</p>
        </div>
      </div>
      <style>{`@keyframes claimPop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function RewardCard({
  reward,
  isVip,
  side,
  onClaim,
  isClaiming,
}: {
  reward?: PassReward;
  isVip: boolean;
  side: "free" | "vip";
  onClaim: (r: PassReward) => void;
  isClaiming: boolean;
}) {
  if (!reward) {
    return <div className="w-[calc(50%-28px)] h-[84px]" />;
  }

  const isLocked   = !reward.isAvailable || (reward.isVipOnly && !isVip);
  const isClaimed  = reward.claimed;
  const isReady    = reward.isAvailable && !isClaimed && (!reward.isVipOnly || isVip);
  const isExclusive = reward.rewardType === "exclusive_content";

  return (
    <button
      onClick={() => isReady && onClaim(reward)}
      disabled={!isReady || isClaiming}
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-[16px] border p-3 w-[calc(50%-28px)] transition-all duration-200",
        isClaimed && "border-green-500/30 bg-green-500/[0.06]",
        isReady && side === "free" && "border-white/20 bg-white/[0.04] hover:border-white/30 active:scale-95 cursor-pointer",
        isReady && side === "vip" && "border-[rgba(251,191,36,0.5)] bg-[rgba(251,191,36,0.1)] shadow-[0_0_12px_rgba(251,191,36,0.15)] hover:shadow-[0_0_18px_rgba(251,191,36,0.3)] active:scale-95 cursor-pointer",
        isLocked && "border-white/[0.04] bg-white/[0.02] opacity-40 grayscale cursor-not-allowed"
      )}
    >
      {/* status badge */}
      {isClaimed && (
        <span className="absolute -top-2 -right-2 size-5 rounded-full bg-green-500 flex items-center justify-center text-[9px] font-black text-white z-10">
          ✓
        </span>
      )}
      {isReady && (
        <span className={cn(
          "absolute -top-2 -right-2 text-white text-[7px] font-black rounded-full px-1.5 py-0.5 z-10 uppercase tracking-wider animate-pulse",
          side === "vip" ? "bg-[#fbbf24] text-[#1a1635]" : "bg-[#7c3aed]"
        )}>
          {isClaiming ? "…" : "Claim"}
        </span>
      )}
      {reward.isVipOnly && isLocked && (
        <span className="absolute -top-2 -right-2 text-[#fbbf24] text-[13px] z-10">🔒</span>
      )}
      {/* Exclusive content star */}
      {isExclusive && !isLocked && (
        <span className="absolute -top-1.5 -left-1.5 text-[11px] z-10">🌟</span>
      )}

      <div
        className={cn(
          "size-10 rounded-[12px] flex items-center justify-center text-[20px]",
          isClaimed ? "bg-green-500/15" : side === "vip" ? "bg-[rgba(251,191,36,0.2)]" : "bg-white/[0.06]"
        )}
      >
        {reward.icon}
      </div>

      <p className={cn(
        "text-[10px] font-bold text-center leading-tight",
        isClaimed ? "text-green-400" : side === "vip" ? "text-[#fbbf24]" : "text-white/60"
      )}>
        {reward.label}
      </p>
    </button>
  );
}

export default function RewardsTab({ rewards, passLevel, user, seasonId, featuredCreator }: RewardsTabProps) {
  const [localRewards, setLocalRewards] = useState(rewards);
  const [claimingId,   setClaimingId]   = useState<number | string | null>(null);
  const [claimAnimReward, setClaimAnimReward] = useState<PassReward | null>(null);
  const [claimAnimMedia,  setClaimAnimMedia]  = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setLocalRewards(rewards); }, [rewards]);

  const grouped = groupByLevel(localRewards);
  const levels = Array.from(grouped.keys()).sort((a, b) => a - b);

  const handleClaim = useCallback(async (reward: PassReward) => {
    setClaimingId(reward.id);
    setError(null);
    try {
      const res  = await fetch("/api/fan-pass/rewards/claim", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ seasonId, rewardId: reward.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to claim"); setClaimingId(null); return; }

      // Mark claimed locally for instant feedback
      setLocalRewards((prev) => prev.map((r) => r.id === reward.id ? { ...r, claimed: true } : r));

      // Trigger animation — pass featured media if it was an exclusive content reward
      setClaimAnimReward(reward);
      setClaimAnimMedia(data.featuredMedia ?? null);
    } catch {
      setError("Something went wrong");
    } finally {
      setClaimingId(null);
    }
  }, [seasonId]);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Featured creator banner ── */}
      {featuredCreator && (
        <div className="flex items-center gap-3 rounded-[18px] border px-4 py-3.5"
          style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(124,58,237,0.06))", borderColor: "rgba(251,191,36,0.25)" }}>
          <div className="size-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[15px]"
            style={{ background: featuredCreator.avatarUrl ? "transparent" : "linear-gradient(135deg,#7c3aed,#ef3976)", border: "2px solid #fbbf24" }}>
            {featuredCreator.avatarUrl
              ? <img src={featuredCreator.avatarUrl} className="size-full object-cover" alt="" />
              : featuredCreator.name.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#fbbf24" }}>
              🌟 This Season's Rewards Feature
            </p>
            <p className="text-[13px] font-black text-white truncate">{featuredCreator.name}</p>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="rounded-xl border px-4 py-3 flex items-center gap-2"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span>
          <p className="text-[12px] font-bold flex-1" style={{ color: "#ef3976" }}>{error}</p>
          <button onClick={() => setError(null)} className="text-white/40">✕</button>
        </div>
      )}

      {/* Track header */}
      <div className="flex justify-between px-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 w-[calc(50%-28px)] text-center">
          Free Track
        </span>
        <div className="w-14" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#fbbf24] w-[calc(50%-28px)] text-center">
          💎 VIP Track
        </span>
      </div>

      {/* Reward rows */}
      <div className="relative flex flex-col gap-6">
        {/* Centre line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[rgba(251,191,36,0.1)]" />

        {levels.map((lvl) => {
          const pair = grouped.get(lvl)!;
          const isCurrentLevel = lvl === passLevel.level;
          const isPassed = lvl < passLevel.level;

          return (
            <div key={lvl} className="flex items-center justify-between gap-2">
              <RewardCard
                reward={pair.free} isVip={user.isVip} side="free"
                onClaim={handleClaim} isClaiming={claimingId === pair.free?.id}
              />

              {/* Level pill */}
              <div
                className={cn(
                  "z-10 flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-black border-4 transition-all",
                  isPassed && "bg-[rgba(251,191,36,0.6)] border-[#221016] text-white",
                  isCurrentLevel && "bg-[#fbbf24] border-[#221016] text-[#1a1635] scale-110",
                  !isPassed && !isCurrentLevel && "bg-[#2e151f] border-[#3a1a25] text-white/25"
                )}
                style={isCurrentLevel ? { boxShadow: "0 0 0 6px rgba(251,191,36,0.2)" } : undefined}
              >
                {lvl}
              </div>

              <RewardCard
                reward={pair.vip} isVip={user.isVip} side="vip"
                onClaim={handleClaim} isClaiming={claimingId === pair.vip?.id}
              />
            </div>
          );
        })}
      </div>

      {/* VIP upsell if not vip — featured creator framed */}
      {!user.isVip && (
        <div className="mt-2 rounded-[18px] overflow-hidden border"
          style={{ borderColor: "rgba(251,191,36,0.35)" }}>
          <div className="p-4 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(124,58,237,0.08))" }}>
            <span className="text-[28px]">💎</span>
            <div className="flex-1">
              <p className="text-[12px] font-black text-white">
                {featuredCreator ? `Unlock ${featuredCreator.name}'s exclusive content` : "Unlock all VIP rewards"}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                10 exclusive photo/video unlocks + 2× XP + every VIP reward on this track
              </p>
            </div>
            <button className="bg-[#fbbf24] text-[#1a1635] rounded-full px-4 py-2 text-[11px] font-black
                               hover:bg-[#fbbf24]/90 active:scale-[0.97] transition-all flex-shrink-0">
              Go VIP
            </button>
          </div>
        </div>
      )}

      {/* Claim animation */}
      {claimAnimReward && (
        <ClaimAnim
          reward={claimAnimReward}
          featuredMedia={claimAnimMedia}
          onDone={() => { setClaimAnimReward(null); setClaimAnimMedia(null); }}
        />
      )}
    </div>
  );
}