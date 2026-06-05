"use client";

import { useRouter } from "next/navigation";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const BORDER = "rgba(124,58,237,0.15)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subscription {
  creatorId: string;
  tier: "standard" | "vip";
  creator?: {
    id: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      image?: string | null;
    };
    profile?: {
      username?: string;
      avatarUrl?: string | null;
    };
    isVerified?: boolean;
    subscriberCount?: number;
  };
}

interface Conversation {
  id: string;
  otherUser?: { id: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function avatarGrad(id: string) {
  return GRADIENTS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Creator row ──────────────────────────────────────────────────────────────
function CreatorRow({ sub, hasConversation, onMessage }: {
  sub: Subscription; hasConversation: boolean; onMessage: () => void;
}) {
  const creatorUser = sub.creator?.user;
  const profile     = sub.creator?.profile;
  if (!creatorUser) return null;

  const name      = creatorUser.name;
  const username  = profile?.username ?? creatorUser.name.toLowerCase().replace(/\s+/g, "_");
  const avatarUrl = profile?.avatarUrl ?? creatorUser.image ?? null;
  const userId    = creatorUser.id;
  const isVip     = sub.tier === "vip";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 group"
      style={{ borderColor: "rgba(124,58,237,0.08)" }}>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="size-10 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[13px]"
          style={{
            background: avatarUrl ? "transparent" : avatarGrad(userId),
            border: `2px solid ${isVip ? "#fbbf24" : "rgba(124,58,237,0.3)"}`,
          }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={name} className="size-full object-cover" />
            : name.charAt(0).toUpperCase()
          }
        </div>
        {isVip && (
          <span className="absolute -top-1 -right-1 text-[8px]">⭐</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[12px] font-black truncate" style={{ color: TEXT }}>{name}</p>
          {sub.creator?.isVerified && (
            <svg className="size-3 flex-shrink-0" viewBox="0 0 20 20" fill={V}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
            </svg>
          )}
        </div>
        <p className="text-[10px]" style={{ color: MUTED }}>@{username}</p>
      </div>

      {/* Message button */}
      <button
        onClick={onMessage}
        className="flex-shrink-0 size-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
        style={{
          background:  hasConversation ? "rgba(124,58,237,0.12)" : GRAD,
          border:      hasConversation ? `1px solid ${BORDER}` : "none",
          boxShadow:   hasConversation ? "none" : "0 4px 12px rgba(124,58,237,0.3)",
        }}
        title={`Message ${name}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={hasConversation ? "rgba(240,234,255,0.6)" : "#fff"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface CreatorQuickListProps {
  subscriptions: Subscription[];
  conversations: Conversation[];
  mobileStrip?:  boolean; // renders as horizontal avatar scroll strip on mobile
}

export function CreatorQuickList({ subscriptions, conversations, mobileStrip = false }: CreatorQuickListProps) {
  const router = useRouter();

  // Build a set of user IDs we already have conversations with
  const conversedUserIds = new Set(
    conversations.map((c) => c.otherUser?.id).filter(Boolean)
  );

  // ── Mobile strip — horizontal scrollable avatar row ──────────────────────────
  if (mobileStrip) {
    if (subscriptions.length === 0) return null;
    return (
      <div className="flex flex-col gap-2 py-2">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>
          Subscribed Creators
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}>
          {subscriptions.map((sub) => {
            const creatorUser = sub.creator?.user;
            const profile     = sub.creator?.profile;
            const userId      = creatorUser?.id;
            if (!creatorUser) return null;

            const url   = profile?.avatarUrl ?? creatorUser.image ?? null;
            const name  = creatorUser.name;
            const isVip = sub.tier === "vip";
            const hasConvo = conversedUserIds.has(userId);

            return (
              <button
                key={sub.creatorId}
                onClick={() => userId && router.push(`/dashboard/user/message/${userId}`)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
                style={{ width: 60 }}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="size-14 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[18px]"
                    style={{
                      background:  url ? "transparent" : avatarGrad(creatorUser.id),
                      border:      `2.5px solid ${isVip ? "#fbbf24" : "rgba(124,58,237,0.4)"}`,
                      boxShadow:   isVip ? "0 0 10px rgba(251,191,36,0.4)" : "none",
                    }}>
                    {url
                      ? <img src={url} alt={name} className="size-full object-cover" />
                      : name.charAt(0).toUpperCase()
                    }
                  </div>
                  {/* Unread dot */}
                  {hasConvo && (
                    <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 bg-[#ef3976] animate-pulse"
                      style={{ borderColor: "#0d0d1a" }} />
                  )}
                  {/* VIP crown */}
                  {isVip && (
                    <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
                  )}
                </div>
                {/* Name */}
                <p className="text-[9px] font-bold text-center leading-tight w-full truncate"
                  style={{ color: MUTED }}>
                  {name.split(" ")[0]}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Desktop full panel ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0"
        style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-black" style={{ color: TEXT }}>Creators</p>
          <span className="text-[10px] font-black rounded-full px-2 py-0.5"
            style={{ background: "rgba(124,58,237,0.15)", color: V }}>
            {subscriptions.length}
          </span>
        </div>
        <p className="text-[10px]" style={{ color: MUTED }}>Subscribed</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <span className="text-3xl">⭐</span>
            <p className="text-[13px] font-black" style={{ color: TEXT }}>No subscriptions</p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              Subscribe to creators to message them
            </p>
          </div>
        ) : (
          subscriptions.map((sub) => {
            const userId = sub.creator?.user?.id;
            return (
              <CreatorRow
                key={sub.creatorId}
                sub={sub}
                hasConversation={conversedUserIds.has(userId)}
                onMessage={() => userId && router.push(`/dashboard/user/message/${userId}`)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default CreatorQuickList;