"use client";

import { useState } from "react";
import Image from "next/image";
import { CommentSection } from "./CommentSection";

export function PostCard({ post, currentUserId, onLikeUpdate }) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);

  async function handleLike() {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });

      const data = await response.json();
      const newCount = data.liked ? post.likeCount + 1 : post.likeCount - 1;
      
      onLikeUpdate(post.id, data.liked, newCount);
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setIsLiking(false);
    }
  }

  const timeAgo = getTimeAgo(new Date(post.createdAt));

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <a href={`/${post.creatorUsername}`} className="shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600">
            {post.creatorAvatar ? (
              <Image
                src={post.creatorAvatar}
                alt={post.creatorName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
  {post.creatorName?.charAt(0) ?? "?"}
</div>
            )}
          </div>
        </a>

        <div className="flex-1 min-w-0">
          <a href={`/${post.creatorUsername || ""}`} className="font-bold text-white hover:text-pink-400 truncate block">
  {post.creatorName || "Unknown"}
</a>
          <div className="text-gray-400 text-sm">@{post.creatorUsername} · {timeAgo}</div>
        </div>
      </div>

      {/* Title & Description */}
      {(post.title || post.description) && (
        <div className="px-4 pb-3">
          {post.title && <h3 className="text-white font-bold text-lg mb-1">{post.title}</h3>}
          {post.description && <p className="text-gray-300 text-sm whitespace-pre-wrap">{post.description}</p>}
        </div>
      )}

      {/* Media */}
      <div className="relative w-full aspect-square bg-black">
        {post.isLocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-gray-900 to-black">
            <div className="text-6xl mb-4">🔒</div>
            <div className="text-white font-bold text-xl mb-2">Locked Content</div>
            <div className="text-gray-400 mb-6">Unlock for ${post.ppvPrice?.toFixed(2)}</div>
            <button className="px-6 py-3 rounded-lg font-bold text-white bg-linear-to-r from-pink-500 to-purple-600">
              Unlock Post
            </button>
          </div>
        ) : post.mediaType === "video" ? (
          <video src={post.mediaUrl} poster={post.thumbnailUrl} controls className="w-full h-full object-contain" />
        ) : (
          <Image src={post.mediaUrl} alt={post.title || "Post"} fill className="object-contain" />
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-6 p-4 border-t border-white/10">
        {/* Like */}
        <button onClick={handleLike} disabled={isLiking} className="flex items-center gap-2 group">
          <svg
            className={`w-6 h-6 transition-all ${
              post.isLiked ? "fill-pink-500 text-pink-500" : "fill-none text-gray-400 group-hover:text-pink-400"
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
          <span className={`font-semibold ${post.isLiked ? "text-pink-500" : "text-gray-400"}`}>
            {post.likeCount.toLocaleString()}
          </span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 group">
          <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="font-semibold text-gray-400">{localCommentCount.toLocaleString()}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          onCommentAdded={() => setLocalCommentCount(prev => prev + 1)}
        />
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}