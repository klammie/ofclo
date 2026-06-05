// app/dashboard/user/messages/page.tsx

import { requireRole } from "@/lib/auth/guard";
import { getUserConversations, getTotalUnreadCount } from "@/lib/queries/message";
import { getUserSubscriptions } from "@/lib/queries/user";
import { ConversationList } from "@/components/messages/ConversationList";
import CreatorQuickList from "@/components/messages/CreatorQuickList";

export default async function UserMessagesPage() {
  const { user } = await requireRole("user", "creator", "agency");

  const [conversations, unreadCount, subscriptions] = await Promise.all([
    getUserConversations(user.id),
    getTotalUnreadCount(user.id),
    getUserSubscriptions(user.id),
  ]);

  return (
    <div
      className="flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100vh-72px)]"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-0 py-3 md:py-4 flex-shrink-0">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-black text-[#f0eaff] leading-tight">
            Messages
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(240,234,255,0.45)" }}>
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: "rgba(239,57,118,0.1)", border: "1px solid rgba(239,57,118,0.25)" }}>
            <span className="size-2 rounded-full bg-[#ef3976] animate-pulse" />
            <span className="text-[11px] font-black" style={{ color: "#ef3976" }}>
              {unreadCount} new
            </span>
          </div>
        )}
      </div>

      {/* ── Mobile: creator strip + conversation list stacked ── */}
      {/* ── Desktop: side-by-side 2/3 + 1/3 grid ── */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-4 overflow-hidden">

        {/* Mobile: creator horizontal strip (above conversations) */}
        <div className="lg:hidden flex-shrink-0 px-4">
          <CreatorQuickList
            subscriptions={subscriptions}
            conversations={conversations}
            mobileStrip
          />
        </div>

        {/* Conversations list — takes full width on mobile */}
        <div className="lg:col-span-2 rounded-[20px] border overflow-hidden flex flex-col flex-1 min-h-0 mx-4 md:mx-0"
          style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.18)" }}>
          <ConversationList conversations={conversations} currentUserId={user.id} />
        </div>

        {/* Desktop: creator sidebar (right panel, hidden on mobile) */}
        <div className="hidden lg:flex rounded-[20px] border overflow-hidden flex-col"
          style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.18)" }}>
          <CreatorQuickList
            subscriptions={subscriptions}
            conversations={conversations}
          />
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Messages · Fanzluv",
  description: "Your conversations",
};