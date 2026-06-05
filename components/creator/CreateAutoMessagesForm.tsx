// components/creator/CreateAutoMessageForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TRIGGER_TYPES = [
  { value: "new_subscription", label: "New Subscription", icon: "🎉", description: "When someone subscribes" },
  { value: "subscription_renewal", label: "Subscription Renewal", icon: "🔄", description: "When subscription renews" },
  { value: "tip_received", label: "Tip Received", icon: "💰", description: "When you receive a tip" },
  { value: "ppv_unlock", label: "PPV Unlock", icon: "🔓", description: "When PPV content is unlocked" },
  { value: "milestone", label: "Milestone", icon: "🏆", description: "After N days subscribed" },
  { value: "birthday", label: "Birthday", icon: "🎂", description: "On subscriber's birthday" },
];

interface CreateAutoMessageFormProps {
  creatorId: string;
}

export function CreateAutoMessageForm({ creatorId }: CreateAutoMessageFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    triggerType: "new_subscription",
    tier: "all", // 'all', 'standard', 'vip'
    messageText: "",
    delayMinutes: "0",
    includeMedia: false,
    mediaType: "image" as "image" | "video",
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (!formData.messageText.trim()) {
      setError("Message text is required");
      return;
    }

    if (formData.includeMedia && !mediaFile) {
      setError("Please select a media file");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if included
      if (formData.includeMedia && mediaFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", mediaFile);
        uploadFormData.append("type", formData.mediaType);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload media");

        const { url } = await uploadResponse.json();
        mediaUrl = url;
        mediaType = formData.mediaType;
      }

      // Create auto message
      const response = await fetch("/api/auto-messages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          triggerType: formData.triggerType,
          tier: formData.tier === "all" ? null : formData.tier,
          messageText: formData.messageText,
          mediaUrl,
          mediaType,
          delayMinutes: parseInt(formData.delayMinutes),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create auto message");
      }

      router.push("/dashboard/creator/auto-messages");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create auto message");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedTrigger = TRIGGER_TYPES.find(t => t.value === formData.triggerType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Trigger Type */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Trigger Event
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TRIGGER_TYPES.map((trigger) => (
            <button
              key={trigger.value}
              type="button"
              onClick={() => setFormData({ ...formData, triggerType: trigger.value })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formData.triggerType === trigger.value
                  ? "bg-pink-500/20 border-pink-500"
                  : "bg-gray-800/50 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{trigger.icon}</span>
                <div>
                  <div className="text-white font-semibold mb-1">{trigger.label}</div>
                  <div className="text-gray-400 text-xs">{trigger.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subscription Tier (for subscription-related triggers) */}
      {(formData.triggerType === "new_subscription" || formData.triggerType === "subscription_renewal") && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <label className="block text-gray-400 text-sm font-semibold mb-3">
            Subscription Tier
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["all", "standard", "vip"].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setFormData({ ...formData, tier })}
                className={`py-3 rounded-lg font-semibold transition-colors capitalize ${
                  formData.tier === tier
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Text */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Message Text
        </label>
        <textarea
          value={formData.messageText}
          onChange={(e) => setFormData({ ...formData, messageText: e.target.value })}
          placeholder="Write your automated message here... You can use {name} to personalize with subscriber's name"
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
          rows={6}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-gray-500 text-xs">
            Use {"{name}"} for subscriber's name, {"{tier}"} for subscription tier
          </p>
          <span className="text-gray-500 text-xs">{formData.messageText.length} characters</span>
        </div>
      </div>

      {/* Delay */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Send Delay
        </label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: "0", label: "Immediately" },
            { value: "60", label: "1 hour" },
            { value: "1440", label: "1 day" },
            { value: "10080", label: "1 week" },
          ].map((delay) => (
            <button
              key={delay.value}
              type="button"
              onClick={() => setFormData({ ...formData, delayMinutes: delay.value })}
              className={`py-3 rounded-lg font-semibold transition-colors ${
                formData.delayMinutes === delay.value
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {delay.label}
            </button>
          ))}
        </div>
      </div>

      {/* Include Media */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.includeMedia}
            onChange={(e) => setFormData({ ...formData, includeMedia: e.target.checked })}
            className="w-5 h-5 rounded bg-gray-800 border-white/10 text-pink-500 focus:ring-pink-500"
          />
          <div>
            <div className="text-white font-semibold">Include Media</div>
            <div className="text-gray-400 text-xs">Attach an image or video to this message</div>
          </div>
        </label>

        {formData.includeMedia && (
          <div className="space-y-4">
            {/* Media Type */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, mediaType: "image" });
                  setMediaFile(null);
                  setPreviewUrl(null);
                }}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
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
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  formData.mediaType === "video"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                🎥 Video
              </button>
            </div>

            {/* File Upload */}
            <input
              type="file"
              accept={formData.mediaType === "image" ? "image/*" : "video/*"}
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"
            />

            {/* Preview */}
            {previewUrl && (
              <div className="relative w-full max-h-64 bg-gray-800 rounded-lg overflow-hidden">
                {formData.mediaType === "image" ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <video src={previewUrl} controls className="w-full h-full object-contain" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-gray-400 text-sm font-semibold mb-3">
          Preview
        </label>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
              You
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm mb-1">Automated Message</div>
              <div className="text-pink-400 text-xs">{selectedTrigger?.label}</div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            {previewUrl && formData.includeMedia && (
              <div className="mb-3">
                {formData.mediaType === "image" ? (
                  <img src={previewUrl} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />
                ) : (
                  <video src={previewUrl} className="w-full rounded-lg max-h-48" />
                )}
              </div>
            )}
            <p className="text-white whitespace-pre-wrap">
              {formData.messageText || "Your message will appear here..."}
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating..." : "Create Auto Message"}
      </button>
    </form>
  );
}