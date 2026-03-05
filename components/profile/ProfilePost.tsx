"use client";

import { useState } from "react";
import Image from "next/image";

export function ProfilePost({ post, creator, isSubscribed, currentUserId }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  async function handleLike() {
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error("Like error:", error);
    }
  }

  const timeAgo = getTimeAgo(new Date(post.createdAt));

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600">
          {creator.avatarUrl ? (
            <Image src={creator.avatarUrl} alt={creator.name} width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {creator.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-white">
            {creator.name} <span className="text-xs text-gray-500 font-normal ml-2">{timeAgo}</span>
          </p>
          <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {post.isLocked ? (isSubscribed ? "Subscriber" : "Locked") : "Public"}
          </span>
        </div>
      </div>

      {/* Content */}
      {(post.title || post.description) && (
        <div className="px-4 pb-4">
          {post.title && <h3 className="text-white font-bold text-lg mb-1">{post.title}</h3>}
          {post.description && <p className="text-gray-300">{post.description}</p>}
        </div>
      )}

      {/* Media */}
      <div className="relative w-full aspect-square">
        {post.isLocked && !isSubscribed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 border border-pink-500/30">
              <span className="text-4xl">🔒</span>
            </div>
            <h4 className="text-2xl font-black text-white mb-2">Exclusive Content</h4>
            <p className="text-white/60 mb-8 max-w-xs text-center">
              Subscribe to unlock this post and more exclusive content.
            </p>
            {post.ppvPrice && (
              <p className="text-white font-bold mb-4">Unlock for ${post.ppvPrice.toFixed(2)}</p>
            )}
          </div>
        ) : post.mediaType === "video" ? (
          <video src={post.mediaUrl} poster={post.thumbnailUrl || undefined} controls className="w-full h-full object-cover" />
        ) : (
          <Image src={post.mediaUrl} alt={post.title || "Post"} fill className="object-cover" />
        )}
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center gap-8 border-t border-white/10">
        <button onClick={handleLike} className="flex items-center gap-2 font-bold group">
          <svg
            className={`w-6 h-6 transition-all ${
              isLiked ? "fill-pink-500 text-pink-500" : "fill-none text-gray-400 group-hover:text-pink-400"
            }`}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className={isLiked ? "text-pink-500" : "text-gray-400"}>{likeCount.toLocaleString()}</span>
        </button>

        <button className="flex items-center gap-2 text-gray-400 font-bold hover:text-blue-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {post.commentCount.toLocaleString()}
        </button>

        <button className="flex items-center gap-2 text-gray-400 font-bold hover:text-green-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tip
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}