// components/messages/ChatWindow.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { PPVMessageInput } from "./PPVMessageInput";

interface ChatWindowProps {
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  initialMessages: any[];
  currentUserId: string;
  isCreator?: boolean;
}

export function ChatWindow({ 
  otherUser, 
  initialMessages, 
  currentUserId,
  isCreator = false 
}: ChatWindowProps) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [showPPVInput, setShowPPVInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isConnected, socket } = useSocket();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  function handleSendMessage(content: string) {
    if (!content.trim()) return;
    
    sendMessage(otherUser.id, content);
    
    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      fromUserId: currentUserId,
      toUserId: otherUser.id,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
      isPpv: false,
      mediaType: null,
      mediaUrl: null,
      thumbnailUrl: null,
      ppvPrice: null,
      isUnlocked: false,
      isOwn: true,
    }]);
  }

  async function handleSendPPV(ppvData: {
    content: string;
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl: string;
    isPpv: boolean;
    ppvPrice: number;
  }) {
    try {
      const response = await fetch("/api/messages/send-ppv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: otherUser.id,
          ...ppvData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send PPV");
      }

      const { message } = await response.json();
      
      // Add message to chat
      setMessages(prev => [...prev, {
        ...message,
        isOwn: true,
        isUnlocked: true, // Creator always sees their own content
      }]);
      
      setShowPPVInput(false);
      
      console.log("[ChatWindow] PPV message sent successfully");
    } catch (error) {
      console.error("Send PPV error:", error);
      alert(error instanceof Error ? error.message : "Failed to send PPV content");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/50">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            {otherUser.avatarUrl ? (
              <img 
                src={otherUser.avatarUrl} 
                alt={otherUser.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="text-white font-bold text-lg">
                {otherUser.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <div className="text-white font-semibold">{otherUser.name}</div>
            <div className="text-gray-400 text-xs">@{otherUser.username}</div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-xs text-gray-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              otherUser={otherUser}
              currentUserId={currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-gray-900/50">
        {showPPVInput ? (
          <PPVMessageInput
            onSend={handleSendPPV}
            onCancel={() => setShowPPVInput(false)}
          />
        ) : (
          <div className="p-4 space-y-2">
            {/* Regular message input */}
            <MessageInput onSendMessage={handleSendMessage} />
            
            {/* PPV Button - Only show for creators */}
            {isCreator && (
              <button
                onClick={() => setShowPPVInput(true)}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold text-sm hover:from-yellow-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
              >
                <span>💰</span>
                <span>Send PPV Content</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}