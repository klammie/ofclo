"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT = "#f0eaff";
const MUTED = "rgba(240,234,255,0.5)";

// ─── Rarity config ────────────────────────────────────────────────────────────
type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY: Record<Rarity, {
  label: string; color: string; icon: string;
  glow: string; badge: string; border: string;
}> = {
  common:    { label: "Common",    color: "#94a3b8", icon: "◆", glow: "rgba(148,163,184,0)",   badge: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)" },
  rare:      { label: "Rare",      color: "#38bdf8", icon: "◆", glow: "rgba(56,189,248,0.2)",  badge: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.35)"  },
  epic:      { label: "Epic",      color: "#a78bfa", icon: "◆", glow: "rgba(167,139,250,0.25)",badge: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.4)"  },
  legendary: { label: "Legendary", color: "#fbbf24", icon: "♦", glow: "rgba(251,191,36,0.35)", badge: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.5)"   },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuggestedCreator {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  subscriberCount: number;
  postCount: number;
  standardPrice: number;
  rarity: Rarity;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
  "linear-gradient(135deg,#a78bfa,#38bdf8)",
  "linear-gradient(135deg,#fb923c,#fbbf24)",
];

function placeholderGrad(id: string) {
  const i = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ url, name, id, size, rarity }: {
  url: string | null; name: string; id: string; size: number; rarity: Rarity;
}) {
  const r = RARITY[rarity];
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0"
      style={{
        width: size, height: size,
        border: `2px solid ${r.color}`,
        boxShadow: `0 0 8px ${r.glow}`,
      }}>
      {url ? (
        <img src={url} alt={name} className="size-full object-cover" />
      ) : (
        <div className="size-full flex items-center justify-center font-black text-white"
          style={{ background: placeholderGrad(id), fontSize: size * 0.36 }}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ─── Single creator row ───────────────────────────────────────────────────────

function CreatorRow({ creator, onSubscribe, isSubscribed, isSubscribing }: {
  creator: SuggestedCreator;
  onSubscribe: () => void;
  isSubscribed: boolean;
  isSubscribing: boolean;
}) {
  const router = useRouter();
  const r = RARITY[creator.rarity];

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: "rgba(124,58,237,0.08)" }}>

      {/* Avatar with rarity ring */}
      <button onClick={() => router.push(`/${creator.username}`)} className="flex-shrink-0">
        <Avatar
          url={creator.avatarUrl}
          name={creator.name}
          id={creator.id}
          size={44}
          rarity={creator.rarity}
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + verified */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => router.push(`/${creator.username}`)}
            className="text-[13px] font-black truncate hover:underline text-left"
            style={{ color: TEXT, background: "none", border: "none", cursor: "pointer" }}
          >
            {creator.name}
          </button>
          {creator.isVerified && (
            <svg className="size-3.5 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
            </svg>
          )}
        </div>

        {/* Rarity pill + subscriber count */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <div className="flex items-center gap-1 rounded-full px-1.5 py-0.5"
            style={{ background: r.badge, border: `1px solid ${r.border}` }}>
            <span style={{ color: r.color, fontSize: 7 }}>{r.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: r.color }}>
              {r.label}
            </span>
          </div>
          <span style={{ color: "rgba(240,234,255,0.2)", fontSize: 9 }}>·</span>
          <span className="text-[10px]" style={{ color: MUTED }}>
            {fmt(creator.subscriberCount)} fans
          </span>
        </div>

        {/* Price */}
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.3)" }}>
          {creator.standardPrice === 0
            ? "Free page"
            : `$${(creator.standardPrice / 100).toFixed(2)}/mo`}
        </p>
      </div>

      {/* Subscribe / Subscribed button */}
      {isSubscribed ? (
        <button
          onClick={() => router.push(`/dashboard/user/message/${creator.userId}`)}
          className="flex-shrink-0 rounded-xl px-2.5 py-1.5 text-[10px] font-black transition-all"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#4ade80",
          }}
        >
          ✓
        </button>
      ) : (
        <button
          onClick={onSubscribe}
          disabled={isSubscribing}
          className="flex-shrink-0 rounded-xl px-2.5 py-1.5 text-[10px] font-black transition-all"
          style={{
            background: `linear-gradient(135deg, ${r.color}22, ${r.color}10)`,
            border: `1px solid ${r.border}`,
            color: r.color,
            opacity: isSubscribing ? 0.6 : 1,
            cursor: isSubscribing ? "not-allowed" : "pointer",
          }}
        >
          {isSubscribing ? "…" : creator.standardPrice === 0 ? "Follow" : "Sub"}
        </button>
      )}
    </div>
  );
}

// ─── Rarity legend ────────────────────────────────────────────────────────────

function RarityLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2.5 border-t"
      style={{ borderColor: "rgba(124,58,237,0.08)" }}>
      {(["legendary", "epic", "rare", "common"] as Rarity[]).map((r) => (
        <div key={r} className="flex items-center gap-1">
          <span style={{ color: RARITY[r].color, fontSize: 7 }}>{RARITY[r].icon}</span>
          <span className="text-[9px] font-bold" style={{ color: RARITY[r].color }}>
            {RARITY[r].label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface SuggestedCreatorsSidebarProps {
  initialCreators: SuggestedCreator[];
  currentUserId: string;
}

export function SuggestedCreatorsSidebar({
  initialCreators,
  currentUserId,
}: SuggestedCreatorsSidebarProps) {
  const router = useRouter();
  const [creators, setCreators]       = useState<SuggestedCreator[]>(initialCreators);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscribed, setSubscribed]   = useState<Set<string>>(new Set());

  const handleSubscribe = useCallback(async (creator: SuggestedCreator) => {
    if (subscribing) return;
    setSubscribing(creator.id);
    try {
      await fetch("/api/subscriptions/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ creatorId: creator.id, tier: "standard" }),
      });
      setSubscribed((prev) => new Set([...prev, creator.id]));
    } catch {}
    finally { setSubscribing(null); }
  }, [subscribing]);

  const handleRefresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/feed/suggested-creators");
      const data = await res.json();
      setCreators(data.creators ?? []);
      setSubscribed(new Set());
    } catch {}
  }, []);

  if (creators.length === 0) return null;

  return (
    <div
      className="flex flex-col border overflow-hidden"
      style={{
        background:   CARD,
        borderColor:  BORDER,
        borderRadius: 20,           // ← was rounded-4xl which doesn't exist in Tailwind
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b"
        style={{ borderColor: "rgba(124,58,237,0.1)", background: "#13112b" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px]">✨</span>
          <h3 className="text-[13px] font-black" style={{ color: TEXT }}>Suggested Creators</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="text-[10px] font-black transition-all hover:opacity-80"
          style={{ color: V, background: "none", border: "none", cursor: "pointer" }}
          title="Refresh suggestions"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Creator list */}
      <div className="px-4">
        {creators.map((creator) => (
          <CreatorRow
            key={creator.id}
            creator={creator}
            onSubscribe={() => handleSubscribe(creator)}
            isSubscribed={subscribed.has(creator.id)}
            isSubscribing={subscribing === creator.id}
          />
        ))}
      </div>

      {/* Rarity legend */}
      <RarityLegend />

      {/* Discover CTA */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
        <button
          onClick={() => router.push("/dashboard/user/discover")}
          className="w-full py-2.5 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
          style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
        >
          Discover All Creators →
        </button>
      </div>
    </div>
  );
}