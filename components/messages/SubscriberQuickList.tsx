// components/messages/SubscriberQuickList.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { SubscriberWithDetails } from "@/lib/types";
import type { ConversationWithUser } from "@/lib/queries/message";

interface SubscriberQuickListProps {
  subscribers: SubscriberWithDetails[];
  conversations: ConversationWithUser[];
}

export function SubscriberQuickList({ 
  subscribers, 
  conversations 
}: SubscriberQuickListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Get list of user IDs we already have conversations with
  const conversationUserIds = new Set(
    conversations.map(conv => conv.otherUser.id)
  );

  // Filter subscribers by search
  const filteredSubscribers = subscribers.filter(sub =>
    sub.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split into: with conversations and without
  const subscribersWithConversations = filteredSubscribers.filter(sub =>
    conversationUserIds.has(sub.userId)
  );
  const subscribersWithoutConversations = filteredSubscribers.filter(sub =>
    !conversationUserIds.has(sub.userId)
  );

  function handleStartConversation(userId: string) {
    router.push(`/dashboard/creator/message/${userId}`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-bold text-lg mb-3">
          Your Subscribers
        </h3>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search subscribers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50"
        />

        {/* Count */}
        <div className="mt-2 text-xs text-gray-400">
          {subscribers.length} subscriber{subscribers.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Subscriber list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredSubscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-sm text-center">
              {searchQuery ? "No subscribers found" : "No subscribers yet"}
            </div>
          </div>
        ) : (
          <>
            {/* Subscribers without conversations (Start new chat) */}
            {subscribersWithoutConversations.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 px-2 mb-2 font-semibold">
                  Start New Chat
                </div>
                <div className="space-y-1">
                  {subscribersWithoutConversations.map((subscriber) => (
                    <SubscriberItem
                      key={subscriber.userId}
                      subscriber={subscriber}
                      hasConversation={false}
                      onClick={() => handleStartConversation(subscriber.userId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Subscribers with existing conversations */}
            {subscribersWithConversations.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 px-2 mb-2 font-semibold">
                  Active Chats
                </div>
                <div className="space-y-1">
                  {subscribersWithConversations.map((subscriber) => (
                    <SubscriberItem
                      key={subscriber.userId}
                      subscriber={subscriber}
                      hasConversation={true}
                      onClick={() => handleStartConversation(subscriber.userId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBER ITEM
// ══════════════════════════════════════════════════════════════════════════════

function SubscriberItem({
  subscriber,
  hasConversation,
  onClick,
}: {
  subscriber: SubscriberWithDetails;
  hasConversation: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
        {subscriber.avatarUrl ? (
          <Image
            src={subscriber.avatarUrl}
            alt={subscriber.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
            {subscriber.name.charAt(0)}
          </div>
        )}

        {/* Tier badge */}
        {subscriber.tier === "vip" && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs">
            ⭐
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm truncate">
          {subscriber.name}
        </div>
        <div className="text-gray-400 text-xs truncate">
          @{subscriber.username}
        </div>
      </div>

      {/* Indicator */}
      {!hasConversation && (
        <div className="text-xs text-pink-400">
          💬
        </div>
      )}
    </button>
  );
}