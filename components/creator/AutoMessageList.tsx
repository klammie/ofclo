// components/creator/AutoMessagesList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AutoMessagesList({ messages }) {
  const router = useRouter();

  async function handleToggle(messageId: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/auto-messages/${messageId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to toggle");

      router.refresh();
    } catch (error) {
      console.error("Toggle error:", error);
      alert("Failed to toggle auto message");
    }
  }

  async function handleDelete(messageId: string) {
    if (!confirm("Delete this auto message?")) return;

    try {
      const response = await fetch(`/api/auto-messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete auto message");
    }
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-white font-bold text-xl mb-2">No auto messages yet</h3>
        <p className="text-gray-400 mb-6">Create automated messages for your subscribers</p>
        <button
          onClick={() => router.push("/dashboard/creator/auto-messages/create")}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
        >
          Create Auto Message
        </button>
      </div>
    );
  }

  const triggerLabels = {
    new_subscription: { label: "New Subscription", icon: "🎉" },
    subscription_renewal: { label: "Renewal", icon: "🔄" },
    tip_received: { label: "Tip Received", icon: "💰" },
    ppv_unlock: { label: "PPV Unlock", icon: "🔓" },
    milestone: { label: "Milestone", icon: "🏆" },
    birthday: { label: "Birthday", icon: "🎂" },
  };

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const trigger = triggerLabels[msg.triggerType] || { label: msg.triggerType, icon: "📧" };
        
        return (
          <div
            key={msg.id}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0 text-2xl">
                {trigger.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{trigger.label}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      {msg.tier && (
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-semibold capitalize">
                          {msg.tier}
                        </span>
                      )}
                      {msg.delayMinutes > 0 && (
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-semibold">
                          Delay: {msg.delayMinutes < 60 ? `${msg.delayMinutes}m` : `${Math.floor(msg.delayMinutes / 60)}h`}
                        </span>
                      )}
                      <span className="text-gray-500">
                        Sent {msg.sentCount} times
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={msg.isActive}
                      onChange={() => handleToggle(msg.id, msg.isActive)}
                      className="w-10 h-6 rounded-full appearance-none bg-gray-700 relative cursor-pointer transition-colors checked:bg-green-500 before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-1 before:left-1 before:transition-transform checked:before:translate-x-4"
                    />
                    <span className={`text-sm font-semibold ${msg.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                      {msg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                  {msg.mediaUrl && (
                    <div className="mb-2">
                      {msg.mediaType === "image" ? (
                        <img src={msg.mediaUrl} alt="Media" className="w-32 h-32 rounded object-cover" />
                      ) : (
                        <div className="w-32 h-32 rounded bg-gray-700 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-white text-sm line-clamp-2">{msg.messageText}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/creator/auto-messages/${msg.id}/edit`)}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}