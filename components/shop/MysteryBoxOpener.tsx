"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MYSTERY_BOXES,
  RARITY_COLORS,
  RARITY_GLOWS,
  type MysteryBoxType,
  type MysteryBoxDefinition,
  type RewardItem,
  type Rarity,
} from "@/lib/types";

// ─── Theme ────────────────────────────────────────────────────────────────────
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.2)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.5)";
const GRAD   = "linear-gradient(135deg, #7c3aed 0%, #ef3976 100%)";

// ─── Rarity label config ──────────────────────────────────────────────────────
const RARITY_LABELS: Record<Rarity, string> = {
  common:    "Common",
  rare:      "Rare",
  epic:      "Epic",
  legendary: "Legendary",
};

const RARITY_ICONS: Record<Rarity, string> = {
  common:    "◆",
  rare:      "◆",
  epic:      "◆",
  legendary: "♦",
};

// ─── Confetti particle ────────────────────────────────────────────────────────
function ConfettiParticle({ color, delay, x }: { color: string; delay: number; x: number }) {
  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${x}%`,
        animation: `confetti-fall 1.2s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <div style={{ width: 8, height: 8, background: color, borderRadius: 2, transform: `rotate(${Math.random() * 360}deg)` }} />
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(180px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Box card ─────────────────────────────────────────────────────────────────
function BoxCard({
  box, selected, onSelect, coinBalance,
}: {
  box: MysteryBoxDefinition;
  selected: boolean;
  onSelect: () => void;
  coinBalance: number;
}) {
  const canAfford = coinBalance >= box.coinPrice;

  return (
    <button
      onClick={onSelect}
      className="flex flex-col rounded-[18px] border overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background:  CARD,
        borderColor: selected ? "rgba(124,58,237,0.7)" : BORDER,
        boxShadow:   selected ? `0 0 24px rgba(124,58,237,0.35), 0 0 0 1px rgba(124,58,237,0.5)` : "none",
        outline:     "none",
        cursor:      "pointer",
      }}
    >
      {/* Box preview area */}
      <div className="relative h-32 flex items-center justify-center overflow-hidden"
        style={{ background: box.gradient }}>
        {/* Glow blob */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${box.glowColor} 0%, transparent 65%)` }} />

        {/* Spinning ring (selected) */}
        {selected && (
          <div className="absolute size-20 rounded-full border-2 border-dashed opacity-50"
            style={{ borderColor: "rgba(255,255,255,0.6)", animation: "spin 4s linear infinite" }} />
        )}

        {/* Box icon */}
        <span className="relative z-10 text-[44px] drop-shadow-lg" style={{
          animation: selected ? "box-bounce 0.8s ease-in-out infinite" : "none",
        }}>
          {box.icon}
        </span>

        {/* Selected badge */}
        {selected && (
          <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[9px] font-black text-white"
            style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}>
            ✓ Selected
          </div>
        )}

        <style>{`
          @keyframes box-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-black" style={{ color: TEXT }}>{box.name}</h3>
          <div className="flex items-center gap-1 rounded-full px-2.5 py-1 flex-shrink-0"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <span className="text-[11px]">💰</span>
            <span className="text-[11px] font-black" style={{ color: "#fbbf24" }}>
              {box.coinPrice.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-[11px] leading-snug" style={{ color: MUTED }}>{box.description}</p>

        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(240,234,255,0.3)" }}>
          Contains: {box.contents}
        </p>

        {!canAfford && (
          <p className="text-[10px] font-bold" style={{ color: "#ef3976" }}>
            Need {(box.coinPrice - coinBalance).toLocaleString()} more coins
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Opening animation ────────────────────────────────────────────────────────
function OpeningAnimation({ box }: { box: MysteryBoxDefinition }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <div className="absolute size-40 rounded-full border-2"
          style={{
            borderColor:  "rgba(255,255,255,0.15)",
            animation:    "spin-slow 2s linear infinite",
            borderStyle:  "dashed",
          }} />
        {/* Inner ring */}
        <div className="absolute size-28 rounded-full border"
          style={{
            borderColor:  "rgba(255,255,255,0.25)",
            animation:    "spin-slow 1.5s linear infinite reverse",
          }} />
        {/* Glow */}
        <div className="absolute size-32 rounded-full"
          style={{ background: `radial-gradient(circle, ${box.glowColor} 0%, transparent 70%)`, animation: "pulse-glow 1s ease-in-out infinite" }} />
        {/* Box */}
        <span className="relative z-10 text-[60px]" style={{ animation: "shake 0.4s ease-in-out infinite" }}>
          {box.icon}
        </span>
      </div>
      <p className="text-[14px] font-black animate-pulse" style={{ color: TEXT }}>
        Opening {box.name}…
      </p>
      <style>{`
        @keyframes spin-slow  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes shake      { 0%,100%{transform:translateX(0) rotate(-3deg)} 50%{transform:translateX(4px) rotate(3deg)} }
      `}</style>
    </div>
  );
}

// ─── Reward reveal card ───────────────────────────────────────────────────────
function RewardReveal({ reward, onClose, onOpenAnother }: {
  reward: RewardItem;
  onClose: () => void;
  onOpenAnother: () => void;
}) {
  const color = RARITY_COLORS[reward.rarity];
  const glow  = RARITY_GLOWS[reward.rarity];
  const isLegendary = reward.rarity === "legendary";
  const isEpic      = reward.rarity === "epic";

  const confettiColors = ["#ef3976", "#7c3aed", "#fbbf24", "#4ade80", "#38bdf8", "#fb923c"];
  const confettiPieces = isLegendary ? 30 : isEpic ? 20 : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-6 relative">
      {/* Confetti */}
      {[...Array(confettiPieces)].map((_, i) => (
        <ConfettiParticle
          key={i}
          color={confettiColors[i % confettiColors.length]}
          delay={i * 0.04}
          x={10 + (i * 73 % 80)}
        />
      ))}

      {/* Rarity label */}
      <div className="flex items-center gap-1.5 rounded-full px-4 py-1.5 border"
        style={{ background: color + "18", borderColor: color + "50" }}>
        <span style={{ color, fontSize: 10 }}>{RARITY_ICONS[reward.rarity]}</span>
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color }}>
          {RARITY_LABELS[reward.rarity]}
        </span>
      </div>

      {/* Reward icon */}
      <div className="relative flex items-center justify-center">
        <div className="absolute size-32 rounded-full"
          style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />
        <div className="relative size-28 rounded-[24px] flex items-center justify-center border-2 text-[56px]"
          style={{
            background:  `linear-gradient(135deg, ${color}20, ${color}08)`,
            borderColor: color + "60",
            boxShadow:   `0 8px 32px ${glow}`,
            animation:   "reward-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}>
          {reward.icon}
        </div>
      </div>

      {/* Name and description */}
      <div className="text-center">
        <h3 className="text-[20px] font-black mb-1" style={{ color: TEXT }}>{reward.name}</h3>
        <p className="text-[13px] max-w-xs mx-auto" style={{ color: MUTED }}>{reward.description}</p>

        {/* Extra info for boosters */}
        {reward.boosterDurationHours && (
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mt-2"
            style={{ background: color + "18", border: `1px solid ${color}30` }}>
            <span className="text-[11px] font-black" style={{ color }}>
              {reward.boosterMultiplier}× boost · {reward.boosterDurationHours >= 24
                ? `${reward.boosterDurationHours / 24}d`
                : `${reward.boosterDurationHours}h`}
            </span>
          </div>
        )}
        {reward.rewardType === "streak_freeze" && reward.rewardAmount && (
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mt-2"
            style={{ background: color + "18", border: `1px solid ${color}30` }}>
            <span className="text-[11px] font-black" style={{ color }}>
              {reward.rewardAmount} day{reward.rewardAmount > 1 ? "s" : ""} of protection
            </span>
          </div>
        )}
        {reward.rewardType === "coins" && reward.rewardAmount && (
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mt-2"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <span className="text-[11px] font-black" style={{ color: "#fbbf24" }}>
              +{reward.rewardAmount.toLocaleString()} coins added to your balance
            </span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={onOpenAnother}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
          style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
          Open Another
        </button>
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: MUTED }}>
          Done
        </button>
      </div>

      <style>{`
        @keyframes reward-pop {
          0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Drop rates info ──────────────────────────────────────────────────────────
function DropRatesInfo() {
  return (
    <div className="rounded-[14px] border p-4" style={{ background: SURF, borderColor: BORDER }}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MUTED }}>
        Drop Rates
      </p>
      <div className="grid grid-cols-2 gap-2">
        {([
          { rarity: "legendary" as Rarity, rate: "2%"  },
          { rarity: "epic"      as Rarity, rate: "12%" },
          { rarity: "rare"      as Rarity, rate: "26%" },
          { rarity: "common"    as Rarity, rate: "60%" },
        ]).map(({ rarity, rate }) => {
          const color = RARITY_COLORS[rarity];
          return (
            <div key={rarity} className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: color + "10", border: `1px solid ${color}25` }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color, fontSize: 8 }}>{RARITY_ICONS[rarity]}</span>
                <span className="text-[11px] font-black capitalize" style={{ color }}>{rarity}</span>
              </div>
              <span className="text-[11px] font-black" style={{ color }}>{rate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface MysteryBoxOpenerProps {
  coinBalance:    number;
  onBalanceChange: (newBalance: number) => void;
}

type Phase = "select" | "opening" | "reveal";

export default function MysteryBoxOpener({ coinBalance, onBalanceChange }: MysteryBoxOpenerProps) {
  const [selectedBox, setSelectedBox] = useState<MysteryBoxType>("creator");
  const [phase, setPhase]             = useState<Phase>("select");
  const [reward, setReward]           = useState<RewardItem | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [openCount, setOpenCount]     = useState(0);
  const [currentBalance, setBalance]  = useState(coinBalance);

  // Sync external balance
  useEffect(() => { setBalance(coinBalance); }, [coinBalance]);

  const selectedBoxDef = MYSTERY_BOXES.find((b) => b.id === selectedBox)!;
  const canAfford = currentBalance >= selectedBoxDef.coinPrice;

  const handleOpen = useCallback(async () => {
    if (!canAfford) return;
    setError(null);
    setPhase("opening");

    try {
      const res = await fetch("/api/shop/mystery-box", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ boxType: selectedBox }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error === "INSUFFICIENT_COINS"
            ? "Not enough coins to open this box."
            : data.error ?? "Failed to open box"
        );
      }

      // Hold on opening animation for a moment
      await new Promise((r) => setTimeout(r, 1800));
      setReward(data.reward);
      setBalance(data.newCoinBalance);
      onBalanceChange(data.newCoinBalance);
      setOpenCount((c) => c + 1);
      setPhase("reveal");
    } catch (e: any) {
      setError(e.message);
      setPhase("select");
    }
  }, [canAfford, selectedBox, onBalanceChange]);

  const handleClose = () => {
    setPhase("select");
    setReward(null);
  };

  const handleOpenAnother = () => {
    setReward(null);
    setPhase("select");
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-black text-[#f0eaff]">Mystery Boxes</h2>
          <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
            Open a box for a random reward · {openCount > 0 && `${openCount} opened this session`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-4 py-2 border"
          style={{ background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.3)" }}>
          <span className="text-[14px]">💰</span>
          <span className="text-[14px] font-black" style={{ color: "#fbbf24" }}>
            {currentBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span>
          <p className="text-[12px] font-bold" style={{ color: "#ef3976" }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Phase: Select */}
      {phase === "select" && (
        <>
          {/* Box selector grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MYSTERY_BOXES.map((box) => (
              <BoxCard
                key={box.id}
                box={box}
                selected={selectedBox === box.id}
                onSelect={() => setSelectedBox(box.id)}
                coinBalance={currentBalance}
              />
            ))}
          </div>

          {/* Open button */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleOpen}
              disabled={!canAfford}
              className="w-full py-4 rounded-2xl text-[15px] font-black text-white transition-all flex items-center justify-center gap-2.5"
              style={{
                background:  canAfford ? selectedBoxDef.gradient : "rgba(124,58,237,0.15)",
                boxShadow:   canAfford ? `0 8px 32px ${selectedBoxDef.glowColor}` : "none",
                opacity:     canAfford ? 1 : 0.6,
                cursor:      canAfford ? "pointer" : "not-allowed",
              }}
            >
              <span className="text-[18px]">{selectedBoxDef.icon}</span>
              {canAfford
                ? `Open ${selectedBoxDef.name} · ${selectedBoxDef.coinPrice.toLocaleString()} 💰`
                : `Not enough coins · Need ${(selectedBoxDef.coinPrice - currentBalance).toLocaleString()} more`
              }
            </button>

            {/* Quick-select other boxes */}
            <div className="flex gap-2 justify-center">
              {MYSTERY_BOXES.filter((b) => b.id !== selectedBox).map((b) => (
                <button key={b.id} onClick={() => setSelectedBox(b.id)}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER, color: MUTED }}>
                  {b.icon} {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Drop rates */}
          <DropRatesInfo />
        </>
      )}

      {/* Phase: Opening */}
      {phase === "opening" && (
        <div className="rounded-[20px] border"
          style={{ background: CARD, borderColor: selectedBoxDef.glowColor + "50" }}>
          <OpeningAnimation box={selectedBoxDef} />
        </div>
      )}

      {/* Phase: Reveal */}
      {phase === "reveal" && reward && (
        <div className="rounded-[20px] border relative overflow-hidden"
          style={{
            background:  CARD,
            borderColor: RARITY_COLORS[reward.rarity] + "60",
            boxShadow:   `0 0 40px ${RARITY_GLOWS[reward.rarity]}`,
          }}>
          {/* Top accent */}
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${RARITY_COLORS[reward.rarity]}, transparent)` }} />
          <RewardReveal
            reward={reward}
            onClose={handleClose}
            onOpenAnother={handleOpenAnother}
          />
        </div>
      )}
    </div>
  );
}