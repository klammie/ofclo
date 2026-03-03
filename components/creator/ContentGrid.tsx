// components/creator/ContentGrid.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PostWithStats } from "@/lib/types";
import { PostCreationModal } from "./PostCreationModel";
import Image from "next/image";

interface ContentGridProps {
  posts: PostWithStats[];
  total: number;
  currentPage: number;
  currentFilter: "all" | "published" | "locked";
  creatorId: string;
}

export function ContentGrid({
  posts,
  total,
  currentPage,
  currentFilter,
  creatorId,
}: ContentGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / 12);

  function handleFilterChange(filter: "all" | "published" | "locked") {
    const params = new URLSearchParams(searchParams);
    params.set("filter", filter);
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this post? This action cannot be undone.")) return;

    setDeletingPostId(postId);
    try {
      const response = await fetch(`/api/creator/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      router.refresh();
    } catch (err) {
      alert("Failed to delete post");
    } finally {
      setDeletingPostId(null);
    }
  }

  return (
    <div>
      {/* Filters & Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange("all")}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              currentFilter === "all"
                ? "bg-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => handleFilterChange("published")}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              currentFilter === "published"
                ? "bg-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Published
          </button>
          <button
            onClick={() => handleFilterChange("locked")}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              currentFilter === "locked"
                ? "bg-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Locked
          </button>
        </div>

        {/* Create Post Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2.5 rounded-lg font-bold text-white bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all"
        >
          + Create Post
        </button>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-white font-bold text-2xl mb-2">No posts yet</h3>
          <p className="text-gray-400 mb-6">
            Start creating content to engage your subscribers
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3 rounded-lg font-bold text-white bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={() => handleDeletePost(post.id)}
                isDeleting={deletingPostId === post.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                ← Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={isPending}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                      page === currentPage
                        ? "bg-pink-500 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <PostCreationModal
          creatorId={creatorId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// POST CARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function PostCard({
  post,
  onDelete,
  isDeleting,
}: {
  post: PostWithStats;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300">
      {/* Media Preview */}
      <div className="relative w-full aspect-square bg-gray-800">
        {post.contentType === "image" ? (
          post.thumbnailUrl || post.mediaUrl ? (
            <Image
              src={post.thumbnailUrl || post.mediaUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              🖼️
            </div>
          )
        ) : post.contentType === "video" ? (
          post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              🎬
            </div>
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            📄
          </div>
        )}

        {/* Locked Badge */}
        {post.isLocked && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold flex items-center gap-1">
            🔒 {post.ppvPrice ? `$${post.ppvPrice}` : "Locked"}
          </div>
        )}

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
          >
            ⋮
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-10 right-0 w-40 bg-gray-900 border border-white/10 rounded-lg overflow-hidden shadow-xl z-10">
              <button
                onClick={() => {
                  alert("Edit functionality coming soon");
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors text-sm"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                disabled={isDeleting}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "🗑️ Delete"}
              </button>
            </div>
          )}
        </div>

        {/* Video Indicator */}
        {post.contentType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-0 h-0 border-l-20 border-l-white border-y-12 border-y-transparent ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Description */}
        {post.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span>👁️</span>
            <span>{post.viewCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>❤️</span>
            <span>{post.likeCount.toLocaleString()}</span>
          </div>
          {post.isLocked && post.unlockCount > 0 && (
            <div className="flex items-center gap-1">
              <span>🔓</span>
              <span>{post.unlockCount}</span>
            </div>
          )}
        </div>

        {/* Revenue (if PPV) */}
        {post.isLocked && post.ppvPrice && post.revenue > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Revenue</span>
              <span className="text-green-400 font-bold text-sm">
                ${post.revenue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="mt-3 text-gray-500 text-xs">
          {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}