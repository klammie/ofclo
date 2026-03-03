// components/messages/ChatWindow.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useSession } from "@/lib/auth/client";
import Image from "next/image";

type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender?: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
};

interface ChatWindowProps {
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  initialMessages: Message[];
}

export function ChatWindow({ otherUser, initialMessages }: ChatWindowProps) {
  const { data: session } = useSession();
  const { socket, isConnected, sendMessage, markAsRead, startTyping, stopTyping } = useSocket();
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read on mount
  useEffect(() => {
    if (session?.user?.id) {
      markAsRead(otherUser.id);
    }
  }, [session?.user?.id, otherUser.id, markAsRead]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Receive new message
    const handleReceiveMessage = (message: Message) => {
      console.log("[ChatWindow] Received message:", message);
      
      // Only add if it's from the current conversation
      if (message.fromUserId === otherUser.id || message.toUserId === otherUser.id) {
        setMessages((prev) => [...prev, message]);
        
        // Mark as read if from other user
        if (message.fromUserId === otherUser.id) {
          markAsRead(otherUser.id);
        }
      }
    };

    // Confirmation message was sent
    const handleMessageSent = (message: Message) => {
      console.log("[ChatWindow] Message sent:", message);
      setMessages((prev) => [...prev, message]);
    };

    // Typing indicator
    const handleUserTyping = ({ userId }: { userId: string }) => {
      if (userId === otherUser.id) {
        setIsTyping(true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Stop showing typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    const handleUserStoppedTyping = ({ userId }: { userId: string }) => {
      if (userId === otherUser.id) {
        setIsTyping(false);
      }
    };

    // Register listeners
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    // Cleanup
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, otherUser.id, markAsRead]);

  // Handle send message
  const handleSendMessage = (content: string) => {
    if (!session?.user?.id || !content.trim()) return;
    
    console.log("[ChatWindow] Sending message:", content);
    sendMessage(otherUser.id, content);
  };

  // Handle typing events
  const handleTypingStart = () => {
    startTyping(otherUser.id);
  };

  const handleTypingStop = () => {
    stopTyping(otherUser.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gray-900/50">
        {/* Avatar */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
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
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate">
            {otherUser.name}
          </div>
          <div className="text-gray-400 text-sm truncate">
            @{otherUser.username}
          </div>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-500"
            }`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-5xl mb-4">💬</div>
            <div className="text-lg font-semibold mb-1">No messages yet</div>
            <div className="text-sm">Send a message to start the conversation</div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.fromUserId === session?.user?.id}
                sender={message.sender || otherUser}
              />
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>{otherUser.name} is typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        disabled={!isConnected}
      />
    </div>
  );
}