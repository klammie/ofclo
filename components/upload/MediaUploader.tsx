// components/upload/MediaUploader.tsx (UPDATED - FIXES VIDEO UPLOAD)
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImageUploader } from "./ImageUploader";
import { VideoUploader } from "./VideoUploader";
import { UploadProgress } from "./UploadProgress";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/utils/file-validation";

type MediaType = "image" | "video" | "both";

interface MediaUploaderProps {
  type:               MediaType;
  container:          "posts" | "avatars" | "covers";
  onUploadComplete:   (result: UploadResult) => void;
  onUploadError?:     (error: string) => void;
  generateThumbnail?: boolean;
  maxFiles?:          number;
  disabled?:          boolean;
}

export type UploadResult = {
  url:           string;
  thumbnailUrl?: string;
  blobName:      string;
  container:     string;
  width?:        number;
  height?:       number;
  size:          number;
  type:          "image" | "video";
  duration?:     number | null;   // NEW: video length in seconds
};


export function MediaUploader({
  type,
  container,
  onUploadComplete,
  onUploadError,
  generateThumbnail = false,
  maxFiles = 1,
  disabled = false,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // BUILD ACCEPT OBJECT FOR DROPZONE
  // CRITICAL: react-dropzone needs file extensions, not MIME types
  const acceptedTypes: Record<string, string[]> = {};
  
  if (type === "image" || type === "both") {
    acceptedTypes["image/*"] = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  }
  
  if (type === "video" || type === "both") {
    acceptedTypes["video/*"] = [".mp4", ".mov", ".avi", ".webm"];
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      if (disabled || uploading) return;

      const file = acceptedFiles[0]; // Handle first file only
      setCurrentFile(file);
      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const fileType = file.type.startsWith("image") ? "image" : "video";

        // Validate file size
        const maxSize = fileType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (file.size > maxSize) {
          throw new Error(
            `File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
          );
        }

        let result: UploadResult;

        if (fileType === "image") {
          // Use ImageUploader logic
          result = await uploadImage(
            file,
            container,
            generateThumbnail,
            setProgress
          );
        } else {
          // Use VideoUploader logic
          result = await uploadVideo(
            file,
            container,
            setProgress
          );
        }

        onUploadComplete(result);
        setCurrentFile(null);
        setProgress(0);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        onUploadError?.(message);
      } finally {
        setUploading(false);
      }
    },
    [container, generateThumbnail, onUploadComplete, onUploadError, disabled, uploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,  // Uses file extensions now
    maxFiles,
    disabled: disabled || uploading,
    multiple: maxFiles > 1,
  });

  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
          }
          ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        {uploading && currentFile ? (
          // Upload in progress
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl">⏳</div>
            <div>
              <div className="text-white font-semibold mb-1">
                Uploading {currentFile.name}
              </div>
              <div className="text-gray-400 text-sm">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <UploadProgress progress={progress} />
          </div>
        ) : (
          // Ready state
          <>
            <div className="text-5xl mb-3">
              {type === "image" ? "🖼️" : type === "video" ? "🎬" : "📁"}
            </div>
            <div className="text-white font-bold text-lg mb-2">
              {isDragActive
                ? "Drop your file here"
                : "Drag & drop or click to upload"
              }
            </div>
            <div className="text-gray-500 text-sm">
              {type === "image" && `Images up to ${MAX_IMAGE_SIZE / 1024 / 1024}MB`}
              {type === "video" && `Videos up to ${MAX_VIDEO_SIZE / 1024 / 1024 / 1024}GB`}
              {type === "both" && "Images or videos"}
            </div>
            {type === "both" && (
              <div className="text-gray-600 text-xs mt-1">
                Images: JPG, PNG, WebP, GIF
                <br />
                Videos: MP4, MOV, AVI, WebM
              </div>
            )}
          </>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// UPLOAD HELPERS
// ══════════════════════════════════════════════════════════════════════════════

async function uploadImage(
  file: File,
  container: string,
  generateThumbnail: boolean,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("container", container);
  formData.append("generateThumbnail", generateThumbnail.toString());

  onProgress(10);

  const response = await fetch("/api/upload/image", {
    method: "POST",
    body: formData,
  });

  onProgress(100);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  const result = await response.json();
  return { ...result, type: "image" as const };
}

async function uploadVideo(
  file: File,
  container: string,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  onProgress(5);

  // --- Step 1: Extract duration + thumbnail in browser ---
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;

  await new Promise((res) => video.addEventListener("loadedmetadata", res));
  const duration = video.duration;

  video.currentTime = Math.min(1, duration / 2);
  await new Promise((res) => video.addEventListener("seeked", res));

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")?.drawImage(video, 0, 0);

  const thumbBlob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
  );

  URL.revokeObjectURL(url);

  // --- Step 2: Get SAS token from your API ---
  const sasResponse = await fetch("/api/upload/sas-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      container,
    }),
  });

  if (!sasResponse.ok) {
    const error = await sasResponse.json();
    throw new Error(error.error || "Failed to get upload token");
  }

  const { sasUrl, blobUrl, blobName } = await sasResponse.json();

  // --- Step 3: Upload video directly to Azure ---
  onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const uploadResponse = await fetch(sasUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type,
    },
    body: arrayBuffer,
  });
  if (!uploadResponse.ok) throw new Error("Failed to upload video");

  // --- Step 4: Upload thumbnail to thumbnails container ---
  const thumbForm = new FormData();
  thumbForm.append("file", thumbBlob, "thumb.jpg");
  thumbForm.append("container", "thumbnails");

  const thumbRes = await fetch("/api/upload/image", {
    method: "POST",
    body: thumbForm,
  });
  const thumbData = await thumbRes.json();

  onProgress(100);

  return {
    url: blobUrl,
    thumbnailUrl: thumbData.url,
    blobName,
    container,
    size: file.size,
    type: "video" as const,
    // include duration if you want to persist it
    width: video.videoWidth,
    height: video.videoHeight,
  };
}
