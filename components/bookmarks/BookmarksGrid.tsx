// components/bookmarks/BookmarksGrid.tsx
"use client";

import { useState } from "react";
import { BookmarkPostCard } from "./BookmarkPostCard";

export function BookmarksGrid({ posts, currentUserId }) {
  const [bookmarkedPosts, setBookmarkedPosts] = useState(posts);

  function handleRemoveBookmark(postId: string) {
    setBookmarkedPosts(prev => prev.filter(post => post.id !== postId));
  }

  if (bookmarkedPosts.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="text-6xl mb-4">🔖</div>
        <h3 className="text-white font-bold text-xl mb-2">No bookmarks yet</h3>
        <p className="text-gray-400">Start saving posts you love!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookmarkedPosts.map((post) => (
        <BookmarkPostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onRemoveBookmark={handleRemoveBookmark}
        />
      ))}
    </div>
  );
}