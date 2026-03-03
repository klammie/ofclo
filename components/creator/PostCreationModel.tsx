// components/creator/PostCreationModal.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaUploader, type UploadResult } from "@/components/upload/MediaUploader";
import { MediaPreview } from "@/components/upload/MediaPreview";

interface PostCreationModalProps {
  creatorId: string;
  onClose:   () => void;
}

export function PostCreationModal({ creatorId, onClose }: PostCreationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<"image" | "video">("image");
  const [isLocked, setIsLocked] = useState(false);
  const [ppvPrice, setPpvPrice] = useState("");

  // Upload state
  const [uploadedMedia, setUploadedMedia] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUploadComplete(result: UploadResult) {
    setUploadedMedia(result);
    setContentType(result.type);
    setError(null);
  }

  function handleUploadError(err: string) {
    setError(err);
  }

  async function handleDeleteMedia() {
    if (!uploadedMedia) return;

    const response = await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blobName: uploadedMedia.blobName,
        container: uploadedMedia.container,
      }),
    });

    if (response.ok) {
      setUploadedMedia(null);
    } else {
      throw new Error("Failed to delete");
    }
  }

 function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!uploadedMedia) {
    setError("Please upload media first");
    return;
  }

  setError(null);
  startTransition(async () => {
    try {
      const response = await fetch("/api/creator/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          title,
          description,
          contentType,
          mediaUrl: uploadedMedia.url,
          thumbnailUrl: uploadedMedia.thumbnailUrl,
          isLocked,
          ppvPrice: isLocked && ppvPrice ? parseFloat(ppvPrice) : null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create post");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    }
  });
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "#14142b", border: "1px solid #2a2a4a" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-black text-xl">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Media upload */}
          {!uploadedMedia ? (
            <MediaUploader
              type="both"
              container="posts"
              generateThumbnail={true}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              disabled={isPending}
            />
          ) : (
            <MediaPreview
              url={uploadedMedia.url}
              type={uploadedMedia.type}
              thumbnailUrl={uploadedMedia.thumbnailUrl}
              onDelete={handleDeleteMedia}
              className="w-full max-h-96"
            />
          )}

          {/* Title */}
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-1.5 block uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your post a title..."
              required
              disabled={isPending}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-pink-500/50 disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-1.5 block uppercase tracking-wider">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              disabled={isPending}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-pink-500/50 resize-none disabled:opacity-50"
            />
          </div>

          {/* Lock & PPV options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={e => setIsLocked(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-gray-600 text-pink-500 focus:ring-pink-500 focus:ring-offset-gray-900"
              />
              <span className="text-white text-sm font-semibold">🔒 Lock content (subscribers only)</span>
            </label>
          </div>

          {isLocked && (
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1.5 block uppercase tracking-wider">
                Pay-Per-View Price (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={ppvPrice}
                  onChange={e => setPpvPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isPending}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-sm text-gray-300 outline-none focus:border-pink-500/50 disabled:opacity-50"
                />
              </div>
              <p className="text-gray-600 text-xs mt-1">Leave empty for subscriber-only content</p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg font-bold text-gray-400 border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !uploadedMedia}
              className="flex-1 py-2.5 rounded-lg font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: "#ec4899" }}
            >
              {isPending ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}