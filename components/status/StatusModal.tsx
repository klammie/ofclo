"use client";

import { useState, useEffect } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Status tiers ─────────────────────────────────────────────────────────────
export const STATUS_TIERS = [
  {
    id:        "explorer",
    label:     "Explorer",
    emoji:     "🧭",
    icon:      "◆",
    color:     "#38bdf8",
    glow:      "rgba(56,189,248,0.35)",
    bg:        "rgba(56,189,248,0.1)",
    border:    "rgba(56,189,248,0.3)",
    minXp:     0,
    maxXp:     2000,
    perks: [
      "Access to the Fan Shop",
      "Explorer profile badge",
      "Daily login bonus coins",
      "Standard mystery boxes",
      "Basic leaderboard access",
    ],
  },
  {
    id:        "supporter",
    label:     "Supporter",
    emoji:     "💙",
    icon:      "◆",
    color:     "#a78bfa",
    glow:      "rgba(167,139,250,0.4)",
    bg:        "rgba(167,139,250,0.1)",
    border:    "rgba(167,139,250,0.3)",
    minXp:     2000,
    maxXp:     8000,
    perks: [
      "Supporter profile badge + glow",
      "10% coin bonus on purchases",
      "Rare mystery boxes unlocked",
      "Early access to limited items",
      "Priority DM queue",
    ],
  },
  {
    id:        "fanatic",
    label:     "Fanatic",
    emoji:     "🔥",
    icon:      "◆",
    color:     "#ef3976",
    glow:      "rgba(239,57,118,0.45)",
    bg:        "rgba(239,57,118,0.1)",
    border:    "rgba(239,57,118,0.3)",
    minXp:     8000,
    maxXp:     20000,
    perks: [
      "Fanatic animated flame badge",
      "25% coin bonus on everything",
      "Epic mystery boxes unlocked",
      "Free streak freeze every month",
      "VIP Fan Pass discount (20%)",
      "Monthly exclusive content drop",
      "Custom status emoji",
    ],
  },
  {
    id:        "presidential",
    label:     "Presidential",
    emoji:     "👑",
    icon:      "♦",
    color:     "#fbbf24",
    glow:      "rgba(251,191,36,0.5)",
    bg:        "rgba(251,191,36,0.12)",
    border:    "rgba(251,191,36,0.4)",
    minXp:     20000,
    maxXp:     Infinity,
    perks: [
      "Presidential crown badge + particle effect",
      "50% coin bonus — maximum tier",
      "All mystery boxes + exclusive drops",
      "Free VIP Fan Pass every season",
      "Monthly 1-on-1 creator access",
      "Presidential-only exclusive content",
      "Featured on Leaderboard",
      "Lifetime discount on all purchases",
    ],
  },
];

// ─── XP action table ──────────────────────────────────────────────────────────
const XP_ACTIONS = [
  { icon: "📅", label: "Subscribe to a Creator (Monthly)",       xp: 100,  category: "subscriptions" },
  { icon: "📆", label: "Subscribe to a Creator (3 Months)",      xp: 350,  category: "subscriptions" },
  { icon: "🗓️", label: "Subscribe to a Creator (Yearly)",        xp: 1500, category: "subscriptions" },
  { icon: "⭐",  label: "Purchase Fan Pass (Current Season)",     xp: 200,  category: "fanpass"       },
  { icon: "💎",  label: "Purchase VIP Fan Pass (Season)",         xp: 500,  category: "fanpass"       },
  { icon: "🗓️", label: "Purchase VIP Fan Pass (3 Month Bundle)", xp: 1200, category: "fanpass"       },
  { icon: "👑",  label: "Purchase VIP Fan Pass (Yearly Bundle)", xp: 3000, category: "fanpass"       },
  { icon: "🔗",  label: "Bundle VIP Fan Pass + Creator Account", xp: 2000, category: "fanpass"       },
  { icon: "💰",  label: "Purchase Coins (any amount)",           xp: 50,   category: "coins"         },
  { icon: "💰",  label: "Purchase Coins (large bundle)",         xp: 300,  category: "coins"         },
  { icon: "🏦",  label: "Deposit Funds (any amount)",            xp: 75,   category: "deposit"       },
  { icon: "🏦",  label: "Deposit Funds ($50+)",                  xp: 400,  category: "deposit"       },
  { icon: "🛍️",  label: "Purchase Item in Shop",                 xp: 25,   category: "shop"          },
  { icon: "🎁",  label: "Purchase Mystery Box",                  xp: 40,   category: "shop"          },
  { icon: "🎯",  label: "Complete Fan Pass Quest",               xp: 10,   category: "activity"      },
  { icon: "🔥",  label: "Maintain 7-day Login Streak",           xp: 50,   category: "activity"      },
];

const ACTION_CATEGORIES = [
  { id: "all",           label: "All",          icon: "⚡" },
  { id: "subscriptions", label: "Subscriptions", icon: "📅" },
  { id: "fanpass",       label: "Fan Pass",      icon: "🎟️" },
  { id: "coins",         label: "Coins",         icon: "💰" },
  { id: "deposit",       label: "Deposits",      icon: "🏦" },
  { id: "shop",          label: "Shop",          icon: "🛍️" },
  { id: "activity",      label: "Activity",      icon: "🎯" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getTierFromXp(xp: number) {
  return [...STATUS_TIERS].reverse().find((t) => xp >= t.minXp) ?? STATUS_TIERS[0];
}

export function getNextTier(current: typeof STATUS_TIERS[0]) {
  const idx = STATUS_TIERS.findIndex((t) => t.id === current.id);
  return STATUS_TIERS[idx + 1] ?? null;
}

function getTierProgress(xp: number, tier: typeof STATUS_TIERS[0]) {
  if (tier.maxXp === Infinity) return 100;
  const range = tier.maxXp - tier.minXp;
  const earned = xp - tier.minXp;
  return Math.min(100, Math.round((earned / range) * 100));
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
type ModalTab = "overview" | "ranks" | "earn" | "perks";

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ xp, tier, nextTier, progress }: {
  xp: number;
  tier: typeof STATUS_TIERS[0];
  nextTier: typeof STATUS_TIERS[0] | null;
  progress: number;
}) {
  return (
    <div className="flex flex-col gap-5">

      {/* Hero card */}
      <div className="relative rounded-[20px] overflow-hidden p-5 border"
        style={{
          background: `linear-gradient(145deg, ${tier.bg}, rgba(13,13,26,0.95))`,
          borderColor: tier.border,
          boxShadow: `0 0 40px ${tier.glow}`,
        }}>
        <div className="absolute -right-8 -top-8 size-40 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)` }} />

        <div className="relative z-10 flex items-center gap-4">
          <div className="text-[52px] flex-shrink-0 drop-shadow-lg">{tier.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: tier.color }}>
              Current Status
            </p>
            <h2 className="text-[22px] font-black" style={{ color: TEXT }}>{tier.label}</h2>
            <p className="text-[12px] mt-1" style={{ color: MUTED }}>
              {fmt(xp)} XP total earned
            </p>
          </div>
        </div>

        {/* XP Progress bar */}
        {nextTier && (
          <div className="mt-4 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold" style={{ color: MUTED }}>
                {fmt(xp - tier.minXp)} / {fmt(tier.maxXp - tier.minXp)} XP
              </span>
              <span className="text-[10px] font-black" style={{ color: tier.color }}>
                {progress}% to {nextTier.label}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-700 relative"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                  boxShadow: `0 0 10px ${tier.glow}`,
                }}>
                <div className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <span>{tier.emoji}</span>
                <span className="text-[9px] font-black" style={{ color: tier.color }}>{tier.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black" style={{ color: nextTier.color }}>{nextTier.label}</span>
                <span>{nextTier.emoji}</span>
              </div>
            </div>
          </div>
        )}

        {tier.id === "presidential" && (
          <div className="mt-4 relative z-10 text-center">
            <p className="text-[13px] font-black" style={{ color: tier.color }}>
              🔥 Maximum status reached — you are a Legend!
            </p>
          </div>
        )}
      </div>

      {/* XP needed */}
      {nextTier && (
        <div className="rounded-[16px] border px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
          <div className="size-9 rounded-xl flex items-center justify-center text-[18px]"
            style={{ background: nextTier.bg }}>{nextTier.emoji}</div>
          <div>
            <p className="text-[12px] font-black" style={{ color: TEXT }}>
              {fmt(tier.maxXp - xp)} XP to {nextTier.label}
            </p>
            <p className="text-[10px]" style={{ color: MUTED }}>
              Subscribe yearly or buy VIP Fan Pass to rank up fast
            </p>
          </div>
        </div>
      )}

      {/* Current perks preview */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MUTED }}>
          Your Current Perks
        </p>
        <div className="flex flex-col gap-2">
          {tier.perks.slice(0, 4).map((perk) => (
            <div key={perk} className="flex items-center gap-2.5">
              <div className="size-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke={tier.color} strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p className="text-[12px]" style={{ color: "rgba(240,234,255,0.8)" }}>{perk}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ALL RANKS TAB ────────────────────────────────────────────────────────────
function RanksTab({ xp }: { xp: number }) {
  const currentTier = getTierFromXp(xp);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>
        All Status Ranks
      </p>
      {STATUS_TIERS.map((tier, i) => {
        const isCurrentTier = tier.id === currentTier.id;
        const isUnlocked    = xp >= tier.minXp;
        const progress      = isCurrentTier ? getTierProgress(xp, tier) : 0;

        return (
          <div key={tier.id}
            className="rounded-[16px] border p-4 transition-all duration-200"
            style={{
              background:  isCurrentTier ? tier.bg : "rgba(255,255,255,0.02)",
              borderColor: isCurrentTier ? tier.border : isUnlocked ? "rgba(255,255,255,0.06)" : BORDER,
              opacity:     !isUnlocked ? 0.5 : 1,
            }}>
            <div className="flex items-center gap-3">
              <div className="text-[28px] flex-shrink-0">{tier.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-black" style={{ color: isCurrentTier ? tier.color : TEXT }}>
                    {tier.label}
                  </p>
                  {isCurrentTier && (
                    <span className="text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider"
                      style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                      Current
                    </span>
                  )}
                  {isUnlocked && !isCurrentTier && (
                    <span className="text-[8px] font-black rounded-full px-2 py-0.5"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>✓ Unlocked</span>
                  )}
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                  {tier.maxXp === Infinity
                    ? `${fmt(tier.minXp)}+ XP`
                    : `${fmt(tier.minXp)} – ${fmt(tier.maxXp)} XP`}
                </p>

                {/* Progress bar for current tier */}
                {isCurrentTier && tier.maxXp !== Infinity && (
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${tier.color}, ${STATUS_TIERS[i + 1]?.color ?? tier.color})`,
                      }} />
                  </div>
                )}
              </div>

              {/* Perk count */}
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] font-black" style={{ color: tier.color }}>{tier.perks.length}</p>
                <p className="text-[9px]" style={{ color: MUTED }}>perks</p>
              </div>
            </div>

            {/* Perks list — only shown for current */}
            {isCurrentTier && (
              <div className="mt-3 pt-3 border-t flex flex-col gap-1.5"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                {tier.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: tier.color }} />
                    <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.75)" }}>{perk}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── EARN XP TAB ─────────────────────────────────────────────────────────────
function EarnTab() {
  const [activeCategory, setCategory] = useState("all");

  const filtered = XP_ACTIONS.filter(
    (a) => activeCategory === "all" || a.category === activeCategory
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>
        How to Earn Status XP
      </p>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ACTION_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-black whitespace-nowrap flex-shrink-0 transition-all"
            style={activeCategory === cat.id
              ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: TEXT }
              : { background: "transparent", borderColor: BORDER, color: MUTED }}>
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered
          .sort((a, b) => b.xp - a.xp)
          .map((action) => {
            const xpColor = action.xp >= 1000 ? "#fbbf24" : action.xp >= 300 ? "#a78bfa" : action.xp >= 100 ? "#38bdf8" : "#ef3976";
            return (
              <div key={action.label}
                className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                <span className="text-[18px] flex-shrink-0">{action.icon}</span>
                <p className="text-[12px] flex-1" style={{ color: "rgba(240,234,255,0.8)" }}>{action.label}</p>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[13px] font-black" style={{ color: xpColor }}>+{fmt(action.xp)}</p>
                  <p className="text-[9px] font-bold" style={{ color: MUTED }}>XP</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── PERKS TAB ────────────────────────────────────────────────────────────────
function PerksTab({ xp }: { xp: number }) {
  const currentTier = getTierFromXp(xp);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>
        Status Perks — All Tiers
      </p>

      {STATUS_TIERS.map((tier) => {
        const isUnlocked = xp >= tier.minXp;
        return (
          <div key={tier.id} className="rounded-[16px] border overflow-hidden"
            style={{
              borderColor: isUnlocked ? tier.border : BORDER,
              opacity: isUnlocked ? 1 : 0.45,
            }}>
            {/* Tier header */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: isUnlocked ? tier.bg : "rgba(255,255,255,0.02)" }}>
              <span className="text-[20px]">{tier.emoji}</span>
              <div className="flex-1">
                <p className="text-[12px] font-black" style={{ color: isUnlocked ? tier.color : MUTED }}>
                  {tier.label}
                </p>
                <p className="text-[9px]" style={{ color: MUTED }}>
                  {tier.minXp === 0 ? "Starting rank" : `${fmt(tier.minXp)} XP required`}
                </p>
              </div>
              {!isUnlocked && (
                <div className="size-6 rounded-full flex items-center justify-center text-[11px]"
                  style={{ background: "rgba(255,255,255,0.06)" }}>🔒</div>
              )}
              {isUnlocked && (
                <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: tier.color }}>✓</div>
              )}
            </div>

            {/* Perks */}
            <div className="px-4 py-3 flex flex-col gap-1.5"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              {tier.perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full flex-shrink-0"
                    style={{ background: isUnlocked ? tier.color : "rgba(255,255,255,0.2)" }} />
                  <p className="text-[11px]" style={{ color: isUnlocked ? "rgba(240,234,255,0.8)" : MUTED }}>
                    {perk}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── STATUS MODAL ─────────────────────────────────────────────────────────────

interface StatusModalProps {
  xp:      number;
  onClose: () => void;
}

export default function StatusModal({ xp, onClose }: StatusModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const tier     = getTierFromXp(xp);
  const nextTier = getNextTier(tier);
  const progress = getTierProgress(xp, tier);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const TABS: { id: ModalTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "ranks",    label: "Ranks",    icon: "🏆" },
    { id: "earn",     label: "Earn XP",  icon: "⚡" },
    { id: "perks",    label: "Perks",    icon: "🎁" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-lg rounded-[24px] border overflow-hidden flex flex-col"
        style={{
          background:  CARD,
          borderColor: tier.border,
          boxShadow:   `0 0 60px ${tier.glow}, 0 24px 80px rgba(0,0,0,0.6)`,
          maxHeight:   "90vh",
          animation:   "popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}>

        {/* Gradient top bar */}
        <div className="h-1 flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${tier.color}, ${nextTier?.color ?? P})` }} />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: BORDER, background: SURF }}>
          <span className="text-[28px]">{tier.emoji}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-black" style={{ color: TEXT }}>Fan Status</h2>
            <p className="text-[11px] font-bold" style={{ color: tier.color }}>{tier.label} · {fmt(xp)} XP</p>
          </div>
          <button onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}>
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: BORDER, background: SURF }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-all"
              style={activeTab === tab.id
                ? { color: TEXT, borderColor: V, background: "rgba(124,58,237,0.06)" }
                : { color: MUTED, borderColor: "transparent" }}>
              <span className="text-[14px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "overview" && (
            <OverviewTab xp={xp} tier={tier} nextTier={nextTier} progress={progress} />
          )}
          {activeTab === "ranks" && <RanksTab xp={xp} />}
          {activeTab === "earn"  && <EarnTab />}
          {activeTab === "perks" && <PerksTab xp={xp} />}
        </div>
      </div>

      <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}