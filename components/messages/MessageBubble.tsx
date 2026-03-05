// components/messages/MessageBubble.tsx
"use client";

import { useState } from "react";

export function MessageBubble({ message, otherUser, currentUserId }) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(message.isUnlocked || false);
  
  // ✅ FIXED: Proper alignment check
  const isOwn = message.fromUserId === currentUserId;

  async function handleUnlock() {
    setIsUnlocking(true);
    try {
      const response = await fetch("/api/messages/unlock-ppv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id }),
      });

      if (!response.ok) throw new Error("Failed to unlock");

      const data = await response.json();
      if (data.unlocked) {
        setIsUnlocked(true);
      }
    } catch (error) {
      console.error("Unlock error:", error);
      alert("Failed to unlock content. Please try again.");
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
            {otherUser?.avatarUrl ? (
              <img 
                src={otherUser.avatarUrl} 
                alt={otherUser.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {otherUser?.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="flex flex-col">
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwn
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                : "bg-gray-800 text-white"
            }`}
          >
            {/* PPV Content */}
            {message.isPpv ? (
              <div>
                {isOwn || isUnlocked ? (
                  // Show unlocked content
                  <div className="space-y-2">
                    {message.mediaType === "image" ? (
                      <img
                        src={message.mediaUrl}
                        alt="PPV content"
                        className="w-full rounded-lg max-w-sm"
                      />
                    ) : message.mediaType === "video" ? (
                      <video
                        src={message.mediaUrl}
                        controls
                        className="w-full rounded-lg max-w-sm"
                      />
                    ) : null}
                    {message.content && (
                      <p className="text-sm mt-2">{message.content}</p>
                    )}
                    {isOwn && (
                      <p className="text-xs text-white/70 mt-1">
                        💰 PPV Content - ${message.ppvPrice}
                      </p>
                    )}
                  </div>
                ) : (
                  // Show locked PPV preview
                  <div className="relative w-64">
                    <div className="w-full h-48 bg-black/50 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm border border-white/20">
                      {/* Blurred preview */}
                      {message.thumbnailUrl && (
                        <img
                          src={message.thumbnailUrl}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20"
                        />
                      )}
                      
                      {/* Lock overlay */}
                      <div className="relative z-10 text-center p-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3 mx-auto border border-yellow-500/30">
                          <span className="text-2xl">🔒</span>
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">
                          Exclusive Content
                        </h4>
                        <p className="text-gray-400 text-xs mb-3">
                          Unlock this {message.mediaType || 'content'}
                        </p>
                        <button
                          onClick={handleUnlock}
                          disabled={isUnlocking}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-sm hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50"
                        >
                          {isUnlocking ? "Unlocking..." : `Unlock for $${message.ppvPrice}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Regular text message
              <p className="break-words whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isOwn && message.isRead && <span className="ml-1 text-blue-400">✓✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}