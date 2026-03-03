// app/dashboard/creator/messages/page.tsx
// Creator messages - view conversations and start new ones with subscribers

import { requireRole } from "@/lib/auth/guard";
import { getUserConversations, getTotalUnreadCount } from "@/lib/queries/message";
import { getCreatorSubscribers } from "@/lib/queries/creator";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConversationList } from "@/components/messages/ConversationList";
import { SubscriberQuickList } from "@/components/messages/SubscriberQuickList";
import { redirect } from "next/navigation";

export default async function CreatorMessagesPage() {
  const { user } = await requireRole("creator");

  // Get creator profile
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // Get conversations
  const conversations = await getUserConversations(user.id);
  const unreadCount = await getTotalUnreadCount(user.id);

  // Get subscribers (for starting new conversations)
  const { subscribers } = await getCreatorSubscribers(creator.id, 1, 50);

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
              ? `You have ${unreadCount} unread message${unreadCount === 1 ? '' : 's'} from subscribers`
              : "Chat with your subscribers"
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

          {/* Subscribers List (1/3 width) */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden h-[calc(100vh-200px)]">
            <SubscriberQuickList 
              subscribers={subscribers}
              conversations={conversations}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Messages - FanVault Creator",
  description: "Chat with your subscribers",
};