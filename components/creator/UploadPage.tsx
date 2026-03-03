// components/creator/UploadTestPage.tsx
"use client";

import { useState } from "react";
import { MediaUploader, type UploadResult } from "@/components/upload/MediaUploader";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { VideoUploader } from "@/components/upload/VideoUploader";
import { MediaPreview } from "@/components/upload/MediaPreview";

interface UploadTestPageProps {
  creatorId: string;
}

export function UploadTestPage({ creatorId }: UploadTestPageProps) {
  // State for different upload types
  const [postImage, setPostImage] = useState<UploadResult | null>(null);
  const [postVideo, setPostVideo] = useState<UploadResult | null>(null);
  const [avatar, setAvatar] = useState<UploadResult | null>(null);
  const [coverImage, setCoverImage] = useState<UploadResult | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleUploadComplete(
    result: UploadResult,
    type: "postImage" | "postVideo" | "avatar" | "cover"
  ) {
    setError(null);
    setSuccessMessage(`✅ ${type} uploaded successfully!`);

    switch (type) {
      case "postImage":
        setPostImage(result);
        break;
      case "postVideo":
        setPostVideo(result);
        break;
      case "avatar":
        setAvatar(result);
        break;
      case "cover":
        setCoverImage(result);
        break;
    }

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  function handleUploadError(err: string, type: string) {
    setError(`${type} upload failed: ${err}`);
    setSuccessMessage(null);
  }

  async function handleDelete(
    result: UploadResult,
    type: "postImage" | "postVideo" | "avatar" | "cover"
  ) {
    try {
      const response = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobName: result.blobName,
          container: result.container,
        }),
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      // Clear the state
      switch (type) {
        case "postImage":
          setPostImage(null);
          break;
        case "postVideo":
          setPostVideo(null);
          break;
        case "avatar":
          setAvatar(null);
          break;
        case "cover":
          setCoverImage(null);
          break;
      }

      setSuccessMessage(`✅ ${type} deleted successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Failed to delete ${type}`);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            📤 Media Upload Test
          </h1>
          <p className="text-gray-400">
            Test all upload functionality: images, videos, avatars, and covers
          </p>
        </div>

        {/* Global Messages */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Post Image Upload ──────────────────────────────────────── */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🖼️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Post Image</h2>
                <p className="text-sm text-gray-400">
                  Optimized for posts (up to 10MB)
                </p>
              </div>
            </div>

            {postImage ? (
              <MediaPreview
                url={postImage.url}
                type="image"
                thumbnailUrl={postImage.thumbnailUrl}
                onDelete={() => handleDelete(postImage, "postImage")}
              />
            ) : (
              <ImageUploader
                container="posts"
                generateThumbnail={true}
                onUploadComplete={(result) =>
                  handleUploadComplete(result, "postImage")
                }
                onUploadError={(err) => handleUploadError(err, "Post Image")}
              />
            )}

            {postImage && (
              <div className="mt-4 p-3 rounded-lg bg-black/30 text-xs font-mono text-gray-400 overflow-x-auto">
                <div className="text-green-400 mb-1">✓ Upload Details:</div>
                <div>URL: {postImage.url}</div>
                {postImage.thumbnailUrl && (
                  <div>Thumbnail: {postImage.thumbnailUrl}</div>
                )}
                <div>Size: {(postImage.size / 1024 / 1024).toFixed(2)} MB</div>
                {postImage.width && postImage.height && (
                  <div>Dimensions: {postImage.width}x{postImage.height}</div>
                )}
              </div>
            )}
          </div>

          {/* ─── Post Video Upload ──────────────────────────────────────── */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎬</span>
              <div>
                <h2 className="text-xl font-bold text-white">Post Video</h2>
                <p className="text-sm text-gray-400">
                  Direct upload (up to 1GB)
                </p>
              </div>
            </div>

            {postVideo ? (
              <MediaPreview
                url={postVideo.url}
                type="video"
                onDelete={() => handleDelete(postVideo, "postVideo")}
              />
            ) : (
              <VideoUploader
                container="posts"
                onUploadComplete={(result) =>
                  handleUploadComplete(result, "postVideo")
                }
                onUploadError={(err) => handleUploadError(err, "Post Video")}
              />
            )}

            {postVideo && (
              <div className="mt-4 p-3 rounded-lg bg-black/30 text-xs font-mono text-gray-400 overflow-x-auto">
                <div className="text-green-400 mb-1">✓ Upload Details:</div>
                <div>URL: {postVideo.url}</div>
                <div>Size: {(postVideo.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            )}
          </div>

          {/* ─── Avatar Upload ──────────────────────────────────────────── */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👤</span>
              <div>
                <h2 className="text-xl font-bold text-white">Avatar</h2>
                <p className="text-sm text-gray-400">
                  Optimized to 512x512px
                </p>
              </div>
            </div>

            {avatar ? (
              <MediaPreview
                url={avatar.url}
                type="image"
                onDelete={() => handleDelete(avatar, "avatar")}
                className="aspect-square"
              />
            ) : (
              <ImageUploader
                container="avatars"
                generateThumbnail={false}
                onUploadComplete={(result) =>
                  handleUploadComplete(result, "avatar")
                }
                onUploadError={(err) => handleUploadError(err, "Avatar")}
              />
            )}

            {avatar && (
              <div className="mt-4 p-3 rounded-lg bg-black/30 text-xs font-mono text-gray-400 overflow-x-auto">
                <div className="text-green-400 mb-1">✓ Upload Details:</div>
                <div>URL: {avatar.url}</div>
                <div>Size: {(avatar.size / 1024 / 1024).toFixed(2)} MB</div>
                {avatar.width && avatar.height && (
                  <div>Dimensions: {avatar.width}x{avatar.height}</div>
                )}
              </div>
            )}
          </div>

          {/* ─── Cover Image Upload ─────────────────────────────────────── */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎨</span>
              <div>
                <h2 className="text-xl font-bold text-white">Cover Image</h2>
                <p className="text-sm text-gray-400">
                  Wide banner (up to 10MB)
                </p>
              </div>
            </div>

            {coverImage ? (
              <MediaPreview
                url={coverImage.url}
                type="image"
                onDelete={() => handleDelete(coverImage, "cover")}
                className="aspect-video"
              />
            ) : (
              <ImageUploader
                container="covers"
                generateThumbnail={false}
                onUploadComplete={(result) =>
                  handleUploadComplete(result, "cover")
                }
                onUploadError={(err) => handleUploadError(err, "Cover Image")}
              />
            )}

            {coverImage && (
              <div className="mt-4 p-3 rounded-lg bg-black/30 text-xs font-mono text-gray-400 overflow-x-auto">
                <div className="text-green-400 mb-1">✓ Upload Details:</div>
                <div>URL: {coverImage.url}</div>
                <div>Size: {(coverImage.size / 1024 / 1024).toFixed(2)} MB</div>
                {coverImage.width && coverImage.height && (
                  <div>Dimensions: {coverImage.width}x{coverImage.height}</div>
                )}
              </div>
            )}
          </div>

          {/* ─── Multi-Upload Test (MediaUploader) ──────────────────────── */}
          <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📁</span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  All-in-One Uploader
                </h2>
                <p className="text-sm text-gray-400">
                  Test MediaUploader component (handles both images and videos)
                </p>
              </div>
            </div>

            <MediaUploader
              type="both"
              container="posts"
              generateThumbnail={true}
              onUploadComplete={(result) => {
                setSuccessMessage(
                  `✅ All-in-one upload succeeded! Type: ${result.type}`
                );
                setTimeout(() => setSuccessMessage(null), 3000);
              }}
              onUploadError={(err) => {
                setError(`All-in-one upload failed: ${err}`);
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span>💡</span> Testing Instructions
          </h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>
              <strong className="text-white">Post Image:</strong> Tests server-side
              upload with Sharp optimization (WebP conversion, compression)
            </li>
            <li>
              <strong className="text-white">Post Video:</strong> Tests direct
              client-to-Azure upload via SAS token (bypasses server limits)
            </li>
            <li>
              <strong className="text-white">Avatar:</strong> Tests image optimization
              with 512x512px resize
            </li>
            <li>
              <strong className="text-white">Cover Image:</strong> Tests large banner
              optimization
            </li>
            <li>
              <strong className="text-white">All-in-One:</strong> Tests the main
              MediaUploader that auto-routes to correct upload method
            </li>
            <li className="pt-2 border-t border-indigo-500/30 mt-3">
              <strong className="text-white">After upload:</strong> Check Azure Portal
              to verify blobs are created in correct containers
            </li>
          </ul>
        </div>

        {/* Azure Portal Link */}
        <div className="mt-6 text-center">
          <a
            href="https://portal.azure.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
          >
            <span>🔗</span>
            Open Azure Portal
          </a>
        </div>
      </div>
    </div>
  );
}