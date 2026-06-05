// components/profile/MediaGrid.tsx
"use client";

import { useState } from "react";
import { MediaGridItem } from "./MediaGridItem";

interface MediaGridProps {
  posts: any[];
  isSubscribed: boolean;
  creatorId: string;
  currentUserId: string | null;
}

export function MediaGrid({ posts, isSubscribed, creatorId, currentUserId }: MediaGridProps) {
  const [selectedPost, setSelectedPost] = useState<any>(null);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-white font-bold text-xl mb-2">No media yet</h3>
        <p className="text-gray-400">Check back later for photos and videos!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {posts.map((post) => (
          <MediaGridItem
            key={post.id}
            post={post}
            isSubscribed={isSubscribed}
            onClick={() => setSelectedPost(post)}
          />
        ))}
      </div>

      {/* Modal for expanded view */}
      {selectedPost && (
        <MediaModal
          post={selectedPost}
          isSubscribed={isSubscribed}
          onClose={() => setSelectedPost(null)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

function MediaModal({ post, isSubscribed, onClose, currentUserId }) {
  const canView = !post.isLocked || isSubscribed;

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Media */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {canView ? (
            post.mediaType === "image" ? (
              <img
                src={post.mediaUrl}
                alt={post.title || "Media"}
                className="w-full max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={post.mediaUrl}
                controls
                autoPlay
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className="w-full max-h-[80vh] object-contain"
/>

            )
          ) : (
            <div className="relative aspect-video bg-gray-800 flex items-center justify-center">
              {post.thumbnailUrl && (
                <img
                  src={post.thumbnailUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30"
                />
              )}
              <div className="relative z-10 text-center p-8">
                <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-pink-500/30">
                  <svg className="w-10 h-10 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Subscribe to Unlock</h3>
                <p className="text-gray-400">This content is for subscribers only</p>
              </div>
            </div>
          )}

          {/* Info */}
          {post.title && (
            <div className="p-4 border-t border-white/10">
              <h3 className="text-white font-semibold mb-1">{post.title}</h3>
              {post.description && (
                <p className="text-gray-400 text-sm">{post.description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}