// components/creator/CreatorApplicationForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreatorApplicationForm({ userId, userName }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: userName,
    bio: "",
    why: "",
    socialLinks: "",
    contentType: "both",
    expectedRevenue: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.displayName || !formData.bio || !formData.why) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.bio.length < 50) {
      setError("Bio must be at least 50 characters");
      return;
    }

    if (formData.why.length < 100) {
      setError("Please provide a detailed reason (min 100 characters)");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit application");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Display Name */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Your creator name"
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          disabled={isSubmitting}
        />
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Bio <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself and your content (min 50 characters)"
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
          rows={4}
          disabled={isSubmitting}
        />
        <p className="text-gray-500 text-xs mt-1">{formData.bio.length} / 50 characters minimum</p>
      </div>

      {/* Why Creator */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Why do you want to become a creator? <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.why}
          onChange={(e) => setFormData({ ...formData, why: e.target.value })}
          placeholder="Share your motivation and goals (min 100 characters)"
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
          rows={4}
          disabled={isSubmitting}
        />
        <p className="text-gray-500 text-xs mt-1">{formData.why.length} / 100 characters minimum</p>
      </div>

      {/* Content Type */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Content Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {["photos", "videos", "both"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, contentType: type })}
              className={`py-3 rounded-lg font-semibold transition-colors ${
                formData.contentType === type
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
              disabled={isSubmitting}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Social Media Links (Optional)
        </label>
        <input
          type="text"
          value={formData.socialLinks}
          onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
          placeholder="Instagram, Twitter, TikTok, etc."
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          disabled={isSubmitting}
        />
      </div>

      {/* Expected Revenue */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Expected Monthly Revenue (Optional)
        </label>
        <select
          value={formData.expectedRevenue}
          onChange={(e) => setFormData({ ...formData, expectedRevenue: e.target.value })}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
          disabled={isSubmitting}
        >
          <option value="">Select range</option>
          <option value="<$500">Less than $500</option>
          <option value="$500-$1000">$500 - $1,000</option>
          <option value="$1000-$5000">$1,000 - $5,000</option>
          <option value="$5000+">$5,000+</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-lg bg-linear-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </button>

      <p className="text-gray-500 text-xs text-center mt-4">
        Applications are typically reviewed within 24-48 hours
      </p>
    </form>
  );
}