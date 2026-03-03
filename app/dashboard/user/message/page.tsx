// app/dashboard/user/messages/page.tsx
// User messages - view conversations and start new ones with creators

import { requireRole } from "@/lib/auth/guard";
import { getUserConversations, getTotalUnreadCount } from "@/lib/queries/message";
import { getUserSubscriptions } from "@/lib/queries/user";
import { ConversationList } from "@/components/messages/ConversationList";
import { CreatorQuickList } from "@/components/messages/CreatorQuickList";

export default async function UserMessagesPage() {
  const { user } = await requireRole("user", "creator", "agency");

  // Get conversations
  const conversations = await getUserConversations(user.id);
  const unreadCount = await getTotalUnreadCount(user.id);

  // Get subscribed creators (for starting new conversations)
  const subscriptions = await getUserSubscriptions(user.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-black text-white mb-2">
            💬 Messages
          </h1>
          <p className="text-gray-400">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
              : "Chat with creators"
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations (2/3 width) */}
          <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden h-[calc(100vh-200px)]">
            <ConversationList 
              conversations={conversations}
              currentUserId={user.id}
            />
          </div>

          {/* Subscribed Creators List (1/3 width) */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden h-[calc(100vh-200px)]">
            <CreatorQuickList 
              subscriptions={subscriptions}
              conversations={conversations}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Messages - FanVault",
  description: "Your conversations",
};