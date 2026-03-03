"use client";

import { useState } from "react";
import { PostCard } from "./PostCard";
import Link from "next/link";

export function FeedGrid({ posts, currentUserId }) {
  const [postsList, setPostsList] = useState(posts);

  function handleLikeUpdate(postId, isLiked, newCount) {
    setPostsList(posts =>
      posts.map(p =>
        p.id === postId
          ? { ...p, isLiked, likeCount: newCount }
          : p
      )
    );
  }

  if (postsList.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-white font-bold text-xl mb-2">No posts yet</h3>
        <p className="text-gray-400 mb-6">
          Subscribe to creators to see their posts here
        </p>
        <Link
          href="/dashboard/user/discover"
          className="px-6 py-3 rounded-lg font-bold text-white bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          Discover Creators
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {postsList.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLikeUpdate={handleLikeUpdate}
        />
      ))}
    </div>
  );
}