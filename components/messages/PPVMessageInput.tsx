// components/messages/PPVMessageInput.tsx
"use client";

import { useState } from "react";

export function PPVMessageInput({ onSend, onCancel }) {
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [price, setPrice] = useState("9.99");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (mediaType === "image" && !file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (mediaType === "video" && !file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    setMediaFile(file);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleSubmit() {
    if (!mediaFile) {
      alert("Please select a file");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", mediaFile);
      formData.append("type", mediaType);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const { url, thumbnailUrl } = await uploadResponse.json();

      // Send PPV message
      await onSend({
        content: caption,
        mediaType,
        mediaUrl: url,
        thumbnailUrl: thumbnailUrl || url,
        isPpv: true,
        ppvPrice: parseFloat(price),
      });

      // Reset form
      setCaption("");
      setMediaFile(null);
      setPreviewUrl(null);
      setPrice("9.99");
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (error) {
      console.error("PPV send error:", error);
      alert("Failed to send PPV content");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="p-4 bg-gray-900 max-h-[600px] overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold">💰 Send PPV Content</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-400 text-sm">
          Subscribers will pay to unlock this content
        </p>
      </div>

      {/* Media Type */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMediaType("image"); setMediaFile(null); setPreviewUrl(null); }}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            mediaType === "image"
              ? "bg-pink-500 text-white"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          📸 Image
        </button>
        <button
          onClick={() => { setMediaType("video"); setMediaFile(null); setPreviewUrl(null); }}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            mediaType === "video"
              ? "bg-pink-500 text-white"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          🎥 Video
        </button>
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">
          Select {mediaType === "image" ? "Image" : "Video"}
        </label>
        <input
          type="file"
          accept={mediaType === "image" ? "image/*" : "video/*"}
          onChange={handleFileChange}
          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"
        />
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Preview</label>
          <div className="relative w-full h-48 bg-gray-800 rounded-lg overflow-hidden">
            {mediaType === "image" ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <video src={previewUrl} controls className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}

      {/* Caption */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">
          Caption (Optional)
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
          rows={2}
        />
      </div>

      {/* Price */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">
          Unlock Price (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white font-bold">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-800 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-pink-500/50"
          />
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSubmit}
        disabled={isUploading || !mediaFile}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "Uploading..." : `Send for $${price}`}
      </button>
    </div>
  );
}