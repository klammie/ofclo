// components/creator/CreatePostForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreatePostFormProps {
  creatorId: string;
}

export function CreatePostForm({ creatorId }: CreatePostFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mediaType: "image" as "image" | "video",
    isLocked: false,
    ppvPrice: "",
    status: "published" as "draft" | "scheduled" | "published",
    scheduledFor: "",
    scheduledTime: "",
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (formData.mediaType === "image" && !file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (formData.mediaType === "video" && !file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    setMediaFile(file);
    setError("");

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!mediaFile) {
      setError("Please select a file");
      return;
    }

    if (formData.isLocked && (!formData.ppvPrice || parseFloat(formData.ppvPrice) <= 0)) {
      setError("Please enter a valid PPV price for locked content");
      return;
    }

    if (formData.status === "scheduled" && !formData.scheduledFor) {
      setError("Please select a date for scheduled post");
      return;
    }

    if (formData.status === "scheduled" && !formData.scheduledTime) {
      setError("Please select a time for scheduled post");
      return;
    }

    setIsUploading(true);

    try {
      // Upload media first
      const uploadFormData = new FormData();
      uploadFormData.append("file", mediaFile);
      uploadFormData.append("type", formData.mediaType);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload media");

      const { url, thumbnailUrl } = await uploadResponse.json();

      // Create post
      const scheduledDateTime = formData.status === "scheduled"
        ? new Date(`${formData.scheduledFor}T${formData.scheduledTime}`)
        : null;

      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          title: formData.title || null,
          description: formData.description || null,
          mediaType: formData.mediaType,
          mediaUrl: url,
          thumbnailUrl: thumbnailUrl || url,
          isLocked: formData.isLocked,
          ppvPrice: formData.isLocked ? parseFloat(formData.ppvPrice) : null,
          status: formData.status,
          scheduledFor: scheduledDateTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create post");
      }

      // Redirect based on status
      if (formData.status === "scheduled") {
        router.push("/dashboard/creator/posts/scheduled");
      } else if (formData.status === "draft") {
        router.push("/dashboard/creator/posts/drafts");
      } else {
        router.push("/dashboard/creator");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setIsUploading(false);
    }
  }

  const minScheduleDate = new Date();
  minScheduleDate.setDate(minScheduleDate.getDate() + 1); // Tomorrow
  const minDateString = minScheduleDate.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Media Type Selection */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Media Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, mediaType: "image" });
              setMediaFile(null);
              setPreviewUrl(null);
            }}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              formData.mediaType === "image"
                ? "bg-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            📸 Image
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, mediaType: "video" });
              setMediaFile(null);
              setPreviewUrl(null);
            }}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              formData.mediaType === "video"
                ? "bg-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            🎥 Video
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Upload {formData.mediaType === "image" ? "Image" : "Video"}
        </label>
        <input
          type="file"
          accept={formData.mediaType === "image" ? "image/*" : "video/*"}
          onChange={handleFileChange}
          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"
        />

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4 relative w-full max-h-96 bg-gray-800 rounded-lg overflow-hidden">
            {formData.mediaType === "image" ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <video src={previewUrl} controls className="w-full h-full object-contain" />
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Title (Optional)
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Give your post a title..."
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {/* Description */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add a caption..."
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
          rows={4}
        />
      </div>

      {/* Lock Content & PPV */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isLocked}
            onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
            className="w-5 h-5 rounded bg-gray-800 border-white/10 text-pink-500 focus:ring-pink-500"
          />
          <div>
            <div className="text-white font-semibold">🔒 Lock Content (Subscribers Only)</div>
            <div className="text-gray-400 text-xs">Only subscribers can view this post</div>
          </div>
        </label>

        {formData.isLocked && (
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              PPV Price (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.ppvPrice}
                onChange={(e) => setFormData({ ...formData, ppvPrice: e.target.value })}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Leave blank for regular subscriber-only content
            </p>
          </div>
        )}
      </div>

      {/* Publishing Options */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Publishing Options
        </label>

        <div className="space-y-3">
          {/* Publish Now */}
          <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
            <input
              type="radio"
              name="status"
              value="published"
              checked={formData.status === "published"}
              onChange={(e) => setFormData({ ...formData, status: "published" })}
              className="w-4 h-4 text-pink-500 focus:ring-pink-500"
            />
            <div>
              <div className="text-white font-semibold text-sm">📤 Publish Now</div>
              <div className="text-gray-400 text-xs">Post immediately</div>
            </div>
          </label>

          {/* Schedule */}
          <label className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
            <input
              type="radio"
              name="status"
              value="scheduled"
              checked={formData.status === "scheduled"}
              onChange={(e) => setFormData({ ...formData, status: "scheduled" })}
              className="w-4 h-4 text-pink-500 focus:ring-pink-500 mt-0.5"
            />
            <div className="flex-1">
              <div className="text-white font-semibold text-sm mb-2">📅 Schedule for Later</div>
              <div className="text-gray-400 text-xs mb-3">Choose when to publish</div>
              
              {formData.status === "scheduled" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 text-xs mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                      min={minDateString}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          </label>

          {/* Save as Draft */}
          <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={formData.status === "draft"}
              onChange={(e) => setFormData({ ...formData, status: "draft" })}
              className="w-4 h-4 text-pink-500 focus:ring-pink-500"
            />
            <div>
              <div className="text-white font-semibold text-sm">💾 Save as Draft</div>
              <div className="text-gray-400 text-xs">Finish later</div>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading}
        className="w-full py-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          "Uploading..."
        ) : formData.status === "scheduled" ? (
          "Schedule Post"
        ) : formData.status === "draft" ? (
          "Save Draft"
        ) : (
          "Publish Post"
        )}
      </button>
    </form>
  );
}