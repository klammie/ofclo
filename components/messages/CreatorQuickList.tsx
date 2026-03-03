// components/messages/CreatorQuickList.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { SubscriptionWithCreator } from "@/lib/types";
import type { ConversationWithUser } from "@/lib/queries/message";
import Link from "next/link";

interface CreatorQuickListProps {
  subscriptions: SubscriptionWithCreator[];
  conversations: ConversationWithUser[];
}

export function CreatorQuickList({ 
  subscriptions, 
  conversations 
}: CreatorQuickListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Get list of creator user IDs we already have conversations with
  const conversationUserIds = new Set(
    conversations.map(conv => conv.otherUser.id)
  );

  // Filter only active subscriptions
  const activeSubscriptions = subscriptions.filter(sub => sub.status === "active");

  // Filter by search
  const filteredCreators = activeSubscriptions.filter(sub =>
    sub.creatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.creatorUsername?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split into: with conversations and without
  const creatorsWithConversations = filteredCreators.filter(sub =>
    conversationUserIds.has(sub.creatorUserId)
  );
  const creatorsWithoutConversations = filteredCreators.filter(sub =>
    !conversationUserIds.has(sub.creatorUserId)
  );

  function handleStartConversation(creatorUserId: string) {
    router.push(`/dashboard/user/message/${creatorUserId}`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-bold text-lg mb-3">
          Your Creators
        </h3>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search creators..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50"
        />

        {/* Count */}
        <div className="mt-2 text-xs text-gray-400">
          {activeSubscriptions.length} subscription{activeSubscriptions.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Creator list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCreators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-sm text-center mb-2">
              {searchQuery ? "No creators found" : "No active subscriptions"}
            </div>
            {!searchQuery && (
              <Link
                href="/dashboard/user/discover"
                className="text-xs text-pink-400 hover:text-pink-300 underline"
              >
                Discover Creators
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Creators without conversations (Start new chat) */}
            {creatorsWithoutConversations.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 px-2 mb-2 font-semibold">
                  Start New Chat
                </div>
                <div className="space-y-1">
                  {creatorsWithoutConversations.map((subscription) => (
                    <CreatorItem
                      key={subscription.subscriptionId}
                      subscription={subscription}
                      hasConversation={false}
                      onClick={() => handleStartConversation(subscription.creatorUserId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Creators with existing conversations */}
            {creatorsWithConversations.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 px-2 mb-2 font-semibold">
                  Active Chats
                </div>
                <div className="space-y-1">
                  {creatorsWithConversations.map((subscription) => (
                    <CreatorItem
                      key={subscription.subscriptionId}
                      subscription={subscription}
                      hasConversation={true}
                      onClick={() => handleStartConversation(subscription.creatorUserId)}
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
// CREATOR ITEM
// ══════════════════════════════════════════════════════════════════════════════

function CreatorItem({
  subscription,
  hasConversation,
  onClick,
}: {
  subscription: SubscriptionWithCreator;
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
        {subscription.creatorAvatarUrl ? (
          <Image
            src={subscription.creatorAvatarUrl}
            alt={subscription.creatorName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
            {subscription.creatorName.charAt(0)}
          </div>
        )}

        {/* Tier badge */}
        {subscription.tier === "vip" && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs">
            ⭐
          </div>
        )}

        {/* Unread badge */}
        {subscription.unreadMessageCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {subscription.unreadMessageCount > 9 ? "9+" : subscription.unreadMessageCount}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm truncate">
          {subscription.creatorName}
        </div>
        <div className="text-gray-400 text-xs truncate">
          @{subscription.creatorUsername}
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