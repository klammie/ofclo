// components/upload/MediaPreview.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

interface MediaPreviewProps {
  url:          string;
  type:         "image" | "video";
  thumbnailUrl?: string;
  onDelete?:    () => void;
  className?:   string;
}

export function MediaPreview({
  url,
  type,
  thumbnailUrl,
  onDelete,
  className = "",
}: MediaPreviewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this file?")) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div
        className={`relative rounded-xl overflow-hidden border border-gray-700 bg-gray-900 ${className}`}
        style={{ aspectRatio: type === "video" ? "16/9" : "1" }}
      >
        {/* Media content */}
        {type === "image" ? (
          <Image
            src={url}
            alt="Uploaded media"
            fill
            className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowFullscreen(true)}
          />
        ) : (
          <video
            src={url}
            controls
            className="w-full h-full object-cover"
            poster={thumbnailUrl}
          />
        )}

        {/* Delete button overlay */}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            title="Delete"
          >
            {isDeleting ? "..." : "🗑️"}
          </button>
        )}

        {/* Type badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-semibold">
          {type === "image" ? "📷 Image" : "🎬 Video"}
        </div>
      </div>

      {/* Fullscreen modal for images */}
      {showFullscreen && type === "image" && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors"
            onClick={() => setShowFullscreen(false)}
          >
            ✕
          </button>
          <Image
            src={url}
            alt="Fullscreen preview"
            fill
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}