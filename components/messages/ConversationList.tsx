"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const BORDER = "rgba(124,58,237,0.15)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageContent: string | null;
  lastMessageAt: string | Date | null;
  unreadCountUser1: number;
  unreadCountUser2: number;
  otherUser?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string | null;
    image?: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relTime(date: string | Date | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7)  return `${d}d`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function avatarGrad(id: string) {
  return GRADIENTS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 44, unread = false }: {
  user: NonNullable<Conversation["otherUser"]>; size?: number; unread?: boolean;
}) {
  const url = user.avatarUrl ?? user.image ?? null;
  return (
    <div className="relative flex-shrink-0">
      <div
        className="rounded-full overflow-hidden flex items-center justify-center font-black text-white"
        style={{
          width: size, height: size,
          background:  url ? "transparent" : avatarGrad(user.id),
          fontSize:    size * 0.36,
          border:      unread ? `2px solid ${P}` : `2px solid rgba(124,58,237,0.3)`,
          boxShadow:   unread ? `0 0 10px rgba(239,57,118,0.35)` : "none",
        }}
      >
        {url
          ? <img src={url} alt={user.name} className="size-full object-cover" />
          : user.name.charAt(0).toUpperCase()
        }
      </div>
      {/* Online dot */}
      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 border-2"
        style={{ borderColor: "#1a1635" }} />
    </div>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────
function ConversationRow({ conv, currentUserId, isActive, onClick }: {
  conv: Conversation; currentUserId: string; isActive: boolean; onClick: () => void;
}) {
  const other    = conv.otherUser;
  const isP1     = conv.participant1Id === currentUserId;
  const unread   = isP1 ? conv.unreadCountUser1 : conv.unreadCountUser2;
  const hasUnread = unread > 0;

  if (!other) return null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 transition-all text-left active:scale-[0.98] group"
      style={{
        background:  isActive ? "rgba(124,58,237,0.12)" : "transparent",
        borderLeft:  isActive ? `3px solid ${V}` : "3px solid transparent",
        minHeight:   72, // good tap target on mobile
      }}
    >
      <Avatar user={other} unread={hasUnread} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[14px] font-black truncate"
            style={{ color: hasUnread ? TEXT : "rgba(240,234,255,0.8)" }}>
            {other.name}
          </p>
          <span className="text-[11px] flex-shrink-0 ml-2 font-bold"
            style={{ color: hasUnread ? P : MUTED }}>
            {relTime(conv.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] truncate"
            style={{ color: hasUnread ? "rgba(240,234,255,0.7)" : MUTED, fontWeight: hasUnread ? 600 : 400 }}>
            {conv.lastMessageContent ?? "Start a conversation…"}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1.5"
              style={{ background: GRAD }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>

      {/* Arrow on mobile */}
      <svg className="flex-shrink-0 opacity-20 group-active:opacity-60 transition-opacity sm:hidden"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="size-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}` }}>
        💬
      </div>
      <p className="text-[14px] font-black" style={{ color: TEXT }}>No conversations yet</p>
      <p className="text-[12px]" style={{ color: MUTED }}>
        Subscribe to a creator and send them a message
      </p>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = conversations.filter((c) =>
    !search || c.otherUser?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = useCallback((conv: Conversation) => {
    setActiveId(conv.id);
    router.push(`/dashboard/user/message/${conv.otherUser?.id}`);
  }, [router]);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0"
        style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-black" style={{ color: TEXT }}>Chats</p>
          <span className="text-[10px] font-black rounded-full px-2 py-0.5"
            style={{ background: "rgba(124,58,237,0.15)", color: V }}>
            {conversations.length}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: BORDER }}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="rgba(240,234,255,0.3)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-xl border pl-9 pr-3 py-2 text-[12px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0
          ? <EmptyState />
          : filtered.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              currentUserId={currentUserId}
              isActive={activeId === conv.id}
              onClick={() => handleOpen(conv)}
            />
          ))
        }
      </div>
    </div>
  );
}