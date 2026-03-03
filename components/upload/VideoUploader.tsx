// components/upload/VideoUploader.tsx (UPDATED - FIXES VIDEO UPLOAD)
"use client";

import { useState } from "react";
import { UploadProgress } from "./UploadProgress";
import type { UploadResult } from "./MediaUploader";
import {
  validateVideoFile,
  MAX_VIDEO_SIZE,
} from "@/lib/utils/file-validation";

interface VideoUploaderProps {
  container:          "posts" | "covers";
  onUploadComplete:   (result: UploadResult) => void;
  onUploadError?:     (error: string) => void;
  onProgress?:        (progress: number) => void;
  disabled?:          boolean;
}

export function VideoUploader({
  container,
  onUploadComplete,
  onUploadError,
  onProgress,
  disabled = false,
}: VideoUploaderProps) {
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
    const validation = validateVideoFile(file);
    if (validation) {
      onUploadError?.(validation.message);
      return;
    }

    setCurrentFile(file);
    setUploading(true);
    updateProgress(0);

    try {
      // Step 1: Get SAS token for direct upload
      updateProgress(5);

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

      const { sasUrl, blobUrl, blobName, container: containerName } = await sasResponse.json();

      // Step 2: Upload directly to Azure using SAS URL
      updateProgress(10);

      const arrayBuffer = await file.arrayBuffer();

      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 90; // Reserve 10% for completion
            updateProgress(10 + percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("PUT", sasUrl);
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(arrayBuffer);
      });

      // Step 3: Mark upload as complete
      updateProgress(95);

      const completeResponse = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobName,
          container: containerName,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to verify upload");
      }

      updateProgress(100);

      // Success!
      const result: UploadResult = {
        url: blobUrl,
        blobName,
        container: containerName,
        size: file.size,
        type: "video",
      };

      onUploadComplete(result);
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
          accept=".mp4,.mov,.avi,.webm"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading && currentFile ? (
          // Uploading state
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-4xl">🎬</div>
            <div className="text-center">
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
            <div className="text-5xl">🎬</div>
            <div className="text-white font-bold text-lg">
              Click to upload video
            </div>
            <div className="text-gray-500 text-sm">
              MP4, MOV, AVI, WebM up to {MAX_VIDEO_SIZE / 1024 / 1024 / 1024}GB
            </div>
          </>
        )}
      </label>
    </div>
  );
}