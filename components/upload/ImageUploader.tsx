// components/upload/ImageUploader.tsx (UPDATED - FIXES VIDEO UPLOAD)
"use client";

import { useState } from "react";
import { UploadProgress } from "./UploadProgress";
import type { UploadResult } from "./MediaUploader";
import {
  validateImageFile,
  MAX_IMAGE_SIZE,
} from "@/lib/utils/file-validation";

interface ImageUploaderProps {
  container:          "posts" | "avatars" | "covers";
  generateThumbnail?: boolean;
  onUploadComplete:   (result: UploadResult) => void;
  onUploadError?:     (error: string) => void;
  onProgress?:        (progress: number) => void;
  disabled?:          boolean;
}

export function ImageUploader({
  container,
  generateThumbnail = false,
  onUploadComplete,
  onUploadError,
  onProgress,
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  function updateProgress(value: number) {
    setProgress(value);
    onProgress?.(value);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || disabled || uploading) return;

    // Validate
    const validation = validateImageFile(file);
    if (validation) {
      onUploadError?.(validation.message);
      return;
    }

    setCurrentFile(file);
    setUploading(true);
    updateProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("container", container);
      formData.append("generateThumbnail", generateThumbnail.toString());

      updateProgress(10);

      // Upload to server (with image optimization)
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      updateProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      // Success!
      onUploadComplete({
        ...result,
        type: "image" as const,
      });

      setCurrentFile(null);
      setProgress(0);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      onUploadError?.(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full">
      {/* File input */}
      <label
        className={`
          relative flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${uploading
            ? "border-indigo-500 bg-indigo-500/10 cursor-not-allowed"
            : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading && currentFile ? (
          // Uploading state
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-4xl">🖼️</div>
            <div className="text-center">
              <div className="text-white font-semibold mb-1">
                Uploading {currentFile.name}
              </div>
              <div className="text-gray-400 text-sm">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <UploadProgress progress={progress} />
            <div className="text-gray-500 text-xs">
              Optimizing image...
            </div>
          </div>
        ) : (
          // Ready state
          <>
            <div className="text-5xl">🖼️</div>
            <div className="text-white font-bold text-lg">
              Click to upload image
            </div>
            <div className="text-gray-500 text-sm">
              JPG, PNG, WebP, GIF up to {MAX_IMAGE_SIZE / 1024 / 1024}MB
            </div>
            {generateThumbnail && (
              <div className="text-gray-600 text-xs">
                Thumbnail will be generated automatically
              </div>
            )}
          </>
        )}
      </label>
    </div>
  );
}