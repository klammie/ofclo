"use client";

// components/messages/CreatorQuickList.tsx

import { useRouter } from "next/navigation";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

const PLACEHOLDER_GRADS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function placeholderGrad(id: string) {
  return PLACEHOLDER_GRADS[
    id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLACEHOLDER_GRADS.length
  ];
}

interface Subscription {
  creatorUserId: string;
  creatorName:   string;
  avatarUrl?:    string | null;
  username?:     string | null;
}

interface Conversation {
  conversationId?:     string;
  id?:                 string;
  otherUser?: {
    id:       string;
    name:     string;
    avatarUrl?: string | null;
    username?:  string | null;
  };
  unreadCount?:        number;
  unreadCountUser1?:   number;
  unreadCountUser2?:   number;
  participant1Id?:     string;
}

interface SuggestedCreator {
  id?:        string;
  userId:     string;
  name:       string;
  username:   string;
  avatarUrl?: string | null;
}

interface CreatorQuickListProps {
  subscriptions:     Subscription[];
  conversations:     Conversation[];
  suggestedCreators?: SuggestedCreator[];
  mobileStrip?:      boolean;
  currentUserId?:    string;
}

export default function CreatorQuickList({
  subscriptions,
  conversations,
  suggestedCreators = [],
  mobileStrip,
  currentUserId,
}: CreatorQuickListProps) {
  const router = useRouter();

  // Build unread map from conversations: otherUserId → unreadCount
  const unreadMap: Record<string, number> = {};
  for (const conv of conversations) {
    const otherId = conv.otherUser?.id;
    if (!otherId) continue;
    const unread = conv.unreadCount ?? 0;
    unreadMap[otherId] = (unreadMap[otherId] ?? 0) + unread;
  }

  // Subscribed creator userIds for dedup
  const subbedUserIds = new Set(subscriptions.map((s) => s.creatorUserId));

  // Suggested creators not already subscribed
  const filteredSuggested = suggestedCreators.filter(
    (c) => !subbedUserIds.has(c.userId) && !subbedUserIds.has(c.id ?? "")
  );

  const handleMessage = (userId: string) => {
    router.push(`/dashboard/user/message/${userId}`);
  };

  // ── Mobile strip ──────────────────────────────────────────────────────────
  if (mobileStrip) {
    const allCreators = [
      ...subscriptions.map((s) => ({
        userId:    s.creatorUserId,
        name:      s.creatorName,
        avatarUrl: s.avatarUrl ?? null,
        username:  s.username  ?? null,
        suggested: false,
      })),
      ...filteredSuggested.map((c) => ({
        userId:    c.userId,
        name:      c.name,
        avatarUrl: c.avatarUrl ?? null,
        username:  c.username  ?? null,
        suggested: true,
      })),
    ];

    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {allCreators.map((c) => {
          const unread = unreadMap[c.userId] ?? 0;
          return (
            <button
              key={c.userId}
              onClick={() => handleMessage(c.userId)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
            >
              <div className="relative">
                <div
                  className="size-12 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[16px]"
                  style={{
                    background: c.avatarUrl ? "transparent" : placeholderGrad(c.userId),
                    border:     `2px solid ${unread > 0 ? P : "rgba(124,58,237,0.3)"}`,
                  }}
                >
                  {c.avatarUrl
                    ? <img src={c.avatarUrl} alt={c.name} className="size-full object-cover" />
                    : c.name.charAt(0).toUpperCase()
                  }
                </div>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
                    style={{ background: P, boxShadow: "0 0 0 2px #0d0d1a" }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
                {c.suggested && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full flex items-center justify-center text-[8px]"
                    style={{ background: GRAD, boxShadow: "0 0 0 2px #0d0d1a" }}>
                    ✨
                  </span>
                )}
              </div>
              <p className="text-[9px] font-black truncate w-12 text-center"
                style={{ color: unread > 0 ? TEXT : MUTED }}>
                {c.name.split(" ")[0]}
              </p>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Desktop sidebar ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0"
        style={{ borderColor: BORDER }}>
        <p className="text-[13px] font-black" style={{ color: TEXT }}>Creators</p>
        <span className="text-[10px] font-black rounded-full px-2 py-0.5"
          style={{ background: "rgba(124,58,237,0.15)", color: V }}>
          {subscriptions.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Subscribed creators ── */}
        {subscriptions.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1.5 text-[9px] font-black uppercase tracking-widest"
              style={{ color: "rgba(240,234,255,0.25)" }}>
              Subscribed
            </p>
            {subscriptions.map((sub) => {
              const unread = unreadMap[sub.creatorUserId] ?? 0;
              return (
                <button
                  key={sub.creatorUserId}
                  onClick={() => handleMessage(sub.creatorUserId)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left hover:bg-white/5 active:scale-[0.98]"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="size-10 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[13px]"
                      style={{
                        background: sub.avatarUrl ? "transparent" : placeholderGrad(sub.creatorUserId),
                        border:     `2px solid ${unread > 0 ? P : "rgba(124,58,237,0.3)"}`,
                      }}
                    >
                      {sub.avatarUrl
                        ? <img src={sub.avatarUrl} alt={sub.creatorName} className="size-full object-cover" />
                        : sub.creatorName.charAt(0).toUpperCase()
                      }
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
                        style={{ background: P, boxShadow: "0 0 0 2px #1a1635" }}>
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black truncate"
                      style={{ color: unread > 0 ? TEXT : "rgba(240,234,255,0.8)" }}>
                      {sub.creatorName}
                    </p>
                    {sub.username && (
                      <p className="text-[10px] truncate" style={{ color: MUTED }}>
                        @{sub.username}
                      </p>
                    )}
                  </div>
                  {unread > 0 && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1.5"
                      style={{ background: GRAD }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Suggested creators ── */}
        {filteredSuggested.length > 0 && (
          <div>
            <p className="px-4 pt-4 pb-1.5 text-[9px] font-black uppercase tracking-widest"
              style={{ color: "rgba(240,234,255,0.25)" }}>
              ✨ Suggested
            </p>
            {filteredSuggested.map((c) => (
              <button
                key={c.userId}
                onClick={() => handleMessage(c.userId)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left hover:bg-white/5 active:scale-[0.98]"
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="size-10 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[13px]"
                    style={{
                      background: c.avatarUrl ? "transparent" : placeholderGrad(c.userId),
                      border:     "2px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    {c.avatarUrl
                      ? <img src={c.avatarUrl} alt={c.name} className="size-full object-cover" />
                      : c.name.charAt(0).toUpperCase()
                    }
                  </div>
                  {/* Suggested sparkle badge */}
                  <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full flex items-center justify-center text-[8px]"
                    style={{ background: GRAD, boxShadow: "0 0 0 2px #1a1635" }}>
                    ✨
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black truncate" style={{ color: "rgba(240,234,255,0.7)" }}>
                    {c.name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: MUTED }}>
                    @{c.username}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-lg"
                  style={{ background: "rgba(124,58,237,0.1)", color: V }}>
                  Subscribe
                </span>
              </button>
            ))}
          </div>
        )}

        {subscriptions.length === 0 && filteredSuggested.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
            <span className="text-3xl">👥</span>
            <p className="text-[13px] font-black" style={{ color: TEXT }}>No creators yet</p>
            <p className="text-[11px]" style={{ color: MUTED }}>Subscribe to creators to message them</p>
          </div>
        )}
      </div>
    </div>
  );
}