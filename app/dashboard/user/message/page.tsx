// app/dashboard/user/messages/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { getUserConversations } from "@/lib/queries/message";
import { getUserSubscriptions } from "@/lib/queries/user";
import { ConversationList } from "@/components/messages/ConversationList";
import CreatorQuickList from "@/components/messages/CreatorQuickList";
import { getSuggestedCreators } from "@/lib/queries/suggested-creators";

export default async function UserMessagesPage() {
  const { user } = await requireRole("user", "creator", "agency");

  const [conversations, subscriptions, suggestedCreators] = await Promise.all([
    getUserConversations(user.id),
    getUserSubscriptions(user.id),
    getSuggestedCreators(user.id, undefined, 6),
  ]);

  return (
    <div
      className="flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100vh-72px)]"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* ── Header — no unread count ── */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-0 py-3 md:py-4 flex-shrink-0">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-black text-[#f0eaff] leading-tight">
            Messages
          </h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-4 overflow-hidden">

        {/* Mobile: creator horizontal strip */}
        <div className="lg:hidden flex-shrink-0 px-4">
          <CreatorQuickList
            subscriptions={subscriptions}
            conversations={conversations}
            suggestedCreators={suggestedCreators}
            mobileStrip
          />
        </div>

        {/* Conversations list */}
        <div className="lg:col-span-2 rounded-[20px] border overflow-hidden flex flex-col flex-1 min-h-0 mx-4 md:mx-0"
          style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.18)" }}>
          <ConversationList conversations={conversations} currentUserId={user.id} />
        </div>

        {/* Desktop: creator sidebar */}
        <div className="hidden lg:flex rounded-[20px] border overflow-hidden flex-col"
          style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.18)" }}>
          <CreatorQuickList
            subscriptions={subscriptions}
            conversations={conversations}
            suggestedCreators={suggestedCreators}
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