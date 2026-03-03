// components/messages/MessageBubble.tsx
"use client";

import Image from "next/image";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  isOwn: boolean;
  sender: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
}

export function MessageBubble({ message, isOwn, sender }: MessageBubbleProps) {
  const timestamp = new Date(message.createdAt);
  const timeString = timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
          {sender.avatarUrl ? (
            <Image
              src={sender.avatarUrl}
              alt={sender.name}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
              {sender.name.charAt(0)}
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-br-sm"
              : "bg-gray-800 text-white rounded-bl-sm"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap wrap-break-words">
            {message.content}
          </p>
        </div>

        {/* Timestamp & Read status */}
        <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs text-gray-500">
            {timeString}
          </span>
          
          {isOwn && (
            <span className="text-xs">
              {message.isRead ? (
                <span className="text-blue-400" title="Read">✓✓</span>
              ) : (
                <span className="text-gray-500" title="Sent">✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}