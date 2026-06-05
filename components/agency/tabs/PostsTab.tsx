// components/agency/tabs/PostsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function PostsTab({ creatorId, creatorUserId }) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, published, scheduled, draft

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  async function fetchPosts() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agency/creators/${creatorId}/posts?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this post?")) return;

    try {
      const response = await fetch(`/api/agency/posts/${postId}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPosts();
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete post");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {["all", "published", "scheduled", "draft"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <Link
          href={`/dashboard/agency/creators/${creatorId}/create-post`}
          className="px-6 py-3 rounded-lg bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
        >
          + Create Post
        </Link>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-white/10">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-400">No posts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onDelete }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Media */}
      <div className="relative aspect-square bg-gray-800">
        {post.media_type === "image" ? (
          <img src={post.thumbnail_url || post.media_url} alt={post.title || "Post"} className="w-full h-full object-cover" />
        ) : (
          <video src={post.media_url} className="w-full h-full object-cover" muted />
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            post.status === "published" ? "bg-green-500 text-white" :
            post.status === "scheduled" ? "bg-blue-500 text-white" :
            "bg-gray-500 text-white"
          }`}>
            {post.status}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {post.title && (
          <h4 className="text-white font-semibold mb-1 line-clamp-1">{post.title}</h4>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span>❤️ {post.like_count}</span>
          <span>💬 {post.comment_count}</span>
          {post.is_locked && <span>🔒 Locked</span>}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(post.id)}
            className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}