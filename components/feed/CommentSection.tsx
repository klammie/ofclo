"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export function CommentSection({ postId, currentUserId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Load comments error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error("Failed to post comment");

      const data = await response.json();
      setComments([data.comment, ...comments]);
      setNewComment("");
      onCommentAdded();
    } catch (error) {
      console.error("Comment error:", error);
      alert("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border-t border-white/10 bg-gray-900/30">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-white/10">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-6 py-2 rounded-lg font-bold text-white bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "..." : "Post"}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No comments yet. Be the first!</div>
        ) : (
          <div className="divide-y divide-white/5">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment }) {
  const timeAgo = getTimeAgo(new Date(comment.created_at));

  return (
    <div className="p-4 hover:bg-white/5 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
          {comment.avatar_url ? (
            <Image src={comment.avatar_url} alt={comment.user_name} width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
              {comment.user_name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-sm">{comment.user_name}</span>
            <span className="text-gray-500 text-xs">@{comment.username}</span>
            <span className="text-gray-600 text-xs">· {timeAgo}</span>
          </div>
          <p className="text-gray-300 text-sm whitespace-pre-wrap wrap-break-words">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}