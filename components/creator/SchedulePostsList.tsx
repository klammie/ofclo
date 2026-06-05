// components/creator/ScheduledPostsList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScheduledPostsList({ posts }) {
  const router = useRouter();

  async function handleCancel(postId: string) {
    if (!confirm("Cancel this scheduled post?")) return;

    try {
      const response = await fetch(`/api/posts/${postId}/cancel-schedule`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel");

      router.refresh();
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel scheduled post");
    }
  }

  async function handlePublishNow(postId: string) {
    if (!confirm("Publish this post immediately?")) return;

    try {
      const response = await fetch(`/api/posts/${postId}/publish-now`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to publish");

      router.refresh();
    } catch (error) {
      console.error("Publish error:", error);
      alert("Failed to publish post");
    }
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-white font-bold text-xl mb-2">No scheduled posts</h3>
        <p className="text-gray-400 mb-6">Schedule posts to publish automatically</p>
        <button
          onClick={() => router.push("/dashboard/creator/posts/create")}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
        >
          Create Post
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <ScheduledPostCard
          key={post.id}
          post={post}
          onCancel={handleCancel}
          onPublishNow={handlePublishNow}
        />
      ))}
    </div>
  );
}

function ScheduledPostCard({ post, onCancel, onPublishNow }) {
  const scheduledDate = new Date(post.scheduledFor);
  const now = new Date();
  const hoursUntil = Math.max(0, (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysUntil = Math.floor(hoursUntil / 24);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Media Preview */}
      <div className="relative aspect-square bg-gray-800">
        {post.mediaType === "image" ? (
          <img
            src={post.thumbnailUrl || post.mediaUrl}
            alt={post.title || "Scheduled post"}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={post.mediaUrl}
            className="w-full h-full object-cover"
            muted
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold">
              📅 Scheduled
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            {post.title && (
              <h3 className="text-white font-semibold mb-1 line-clamp-1">{post.title}</h3>
            )}
            <div className="flex items-center gap-2 text-xs">
              {post.isLocked && (
                <span className="px-2 py-1 rounded bg-pink-500/90 text-white font-semibold">
                  🔒 Locked
                </span>
              )}
              {post.mediaType === "video" && (
                <span className="px-2 py-1 rounded bg-black/60 text-white font-semibold">
                  🎥
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Schedule Info */}
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-1">Scheduled for</div>
          <div className="text-white font-semibold">
            {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-pink-400 text-xs mt-1">
            {daysUntil > 0 ? (
              `In ${daysUntil} day${daysUntil > 1 ? "s" : ""}`
            ) : hoursUntil > 1 ? (
              `In ${Math.floor(hoursUntil)} hours`
            ) : (
              "Less than 1 hour"
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onPublishNow(post.id)}
            className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Publish Now
          </button>
          <button
            onClick={() => onCancel(post.id)}
            className="flex-1 py-2 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}