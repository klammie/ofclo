"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Conversation = {
  conversationId: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
  };
  unreadCount: number;
  updatedAt: Date;
};

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId?: string;
}

// ✅ Move formatTimestamp here
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
};

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations by search
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-white font-bold text-xl mb-3">Messages</h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <div className="text-5xl mb-4">💬</div>
            <div className="text-lg font-semibold mb-1">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </div>
            <div className="text-sm text-center">
              {searchQuery
                ? "Try a different search term"
                : "Start a conversation with a creator"}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversationId}
                conversation={conversation}
                onClick={() =>
                  router.push(`/dashboard/user/message/${conversation.otherUser.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONVERSATION ITEM
// ══════════════════════════════════════════════════════════════════════════════

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const { otherUser, lastMessage, unreadCount, updatedAt } = conversation;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
        {otherUser.avatarUrl ? (
          <Image
            src={otherUser.avatarUrl}
            alt={otherUser.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold">
            {otherUser.name.charAt(0)}
          </div>
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name & Timestamp */}
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-white truncate">{otherUser.name}</div>
          <div className="text-xs text-gray-500 shrink-0 ml-2">
            {formatTimestamp(new Date(updatedAt))}
          </div>
        </div>

        {/* Last message */}
        <div
          className={`text-sm truncate ${
            unreadCount > 0 ? "text-white font-medium" : "text-gray-400"
          }`}
        >
          {lastMessage.content}
        </div>
      </div>
    </button>
  );
}