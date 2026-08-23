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
  id:                  string;
  conversationId?:     string;
  participant1Id:      string;
  participant2Id:      string;
  lastMessageContent:  string | null;
  lastMessageAt:       string | Date | null;
  lastMessageSenderId: string | null;   // ← who sent the last message
  unreadCount?:        number;          // ← from getUserConversations CASE WHEN
  unreadCountUser1:    number;
  unreadCountUser2:    number;
  otherUser?: {
    id:        string;
    name:      string;
    username?: string;
    avatarUrl?: string | null;
    image?:    string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relTime(date: string | Date | null): string {
  if (!date) return "";

  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else {
    // Normalize postgres timestamp:
    // "2026-08-02 19:17:23.42731" → "2026-08-02T19:17:23.427Z"
    const normalized = String(date)
      .replace(" ", "T")           // space → T
      .replace(/(\.\d{3})\d+/, "$1") // truncate fractional seconds to 3 digits
      .replace(/([+-]\d{2}:\d{2})?$/, (tz) => tz || "Z"); // append Z if no timezone
    d = new Date(normalized);
  }

  if (isNaN(d.getTime())) return "";

  const diff = Date.now() - d.getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
// Replace the ConversationRow function in ConversationList.tsx

function ConversationRow({ conv, currentUserId, isActive, onClick }: {
  conv: Conversation; currentUserId: string; isActive: boolean; onClick: () => void;
}) {
  const other = conv.otherUser;

  const unread = (() => {
    if (conv.unreadCount !== undefined && conv.unreadCount !== null) return conv.unreadCount;
    const isP1 = conv.participant1Id === currentUserId;
    return isP1 ? (conv.unreadCountUser1 ?? 0) : (conv.unreadCountUser2 ?? 0);
  })();
  const hasUnread = unread > 0;

  const senderPrefix = conv.lastMessageSenderId === currentUserId ? "You: " : "";

  if (!other) return null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 transition-all text-left active:scale-[0.98] border-l-2"
      style={{
        background:  isActive ? "rgba(124,58,237,0.12)" : "transparent",
        borderColor: isActive ? V : "transparent",
        minHeight:   72,
      }}
    >
      {/* Avatar — with pink dot when unread, identical to creator ConvRow */}
      <div className="relative flex-shrink-0">
        <div
          className="size-11 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[15px]"
          style={{
            background: other.avatarUrl ? "transparent" : avatarGrad(other.id),
            border:     hasUnread ? `2px solid ${P}` : "2px solid rgba(124,58,237,0.3)",
            boxShadow:  hasUnread ? `0 0 10px rgba(239,57,118,0.35)` : "none",
          }}
        >
          {other.avatarUrl
            ? <img src={other.avatarUrl} alt={other.name} className="size-full object-cover" />
            : other.name.charAt(0).toUpperCase()
          }
        </div>
        {/* Pink dot badge — same as creator */}
        {hasUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 bg-[#ef3976]"
            style={{ borderColor: "#1a1635" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[13px] font-black truncate"
            style={{ color: hasUnread ? TEXT : "rgba(240,234,255,0.75)" }}>
            {other.name}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {conv.lastMessageAt && (
              <span className="text-[10px] font-bold" style={{ color: hasUnread ? P : MUTED }}>
                {relTime(conv.lastMessageAt)}
              </span>
            )}
            {/* Count badge — same as creator */}
            {hasUnread && (
              <span
                className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1.5"
                style={{ background: GRAD }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
        </div>
        <p className="text-[12px] truncate"
          style={{ color: hasUnread ? "rgba(240,234,255,0.65)" : MUTED, fontWeight: hasUnread ? 600 : 400 }}>
          {conv.lastMessageContent
            ? `${senderPrefix}${conv.lastMessageContent}`
            : "Start a conversation…"
          }
        </p>
      </div>

      <svg className="flex-shrink-0 opacity-20 lg:hidden" width="14" height="14"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
  const [localConvs, setLocalConvs] = useState(conversations);

  console.log("[ConvList] first conv:", JSON.stringify(conversations[0], null, 2));
  console.log("[ConvList] first conv:", {
  unreadCount:      conversations[0]?.unreadCount,
  unreadCountUser1: conversations[0]?.unreadCountUser1,
  unreadCountUser2: conversations[0]?.unreadCountUser2,
  lastMessageAt:    conversations[0]?.lastMessageAt,
  lastMessageSenderId: conversations[0]?.lastMessageSenderId,
});

  const filtered = localConvs.filter((c) =>
    !search || c.otherUser?.name.toLowerCase().includes(search.toLowerCase())
  );

  

  const handleOpen = useCallback((conv: Conversation) => {
    setActiveId(conv.conversationId ?? conv.id);

    // Optimistically clear unread badge in the list
    setLocalConvs((prev) => prev.map((c) => {
      const cId = c.conversationId ?? c.id;
      const convId = conv.conversationId ?? conv.id;
      if (cId !== convId) return c;
      return { ...c, unreadCount: 0, unreadCountUser1: 0, unreadCountUser2: 0 };
    }));

    // Mark all messages from the other user as read on the server
    fetch("/api/messages/read", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ fromUserId: conv.otherUser?.id }),
    }).catch(() => {});

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
            {localConvs.length}
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
              key={conv.conversationId ?? conv.id}
              conv={conv}
              currentUserId={currentUserId}
              isActive={activeId === (conv.conversationId ?? conv.id)}
              onClick={() => handleOpen(conv)}
            />
          ))
        }
      </div>
    </div>
  );
}