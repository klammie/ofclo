// components/campaigns/CreateCampaignForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateCampaignForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalAmount: "",
    deadline: "",
    imageUrl: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title || !formData.description || !formData.goalAmount) {
      setError("Title, description, and goal amount are required");
      return;
    }

    if (parseFloat(formData.goalAmount) <= 0) {
      setError("Goal amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          goalAmount: parseFloat(formData.goalAmount),
          deadline: formData.deadline || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      router.push("/dashboard/creator/campaigns");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create campaign");
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

      {/* Title */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Campaign Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., New Studio Equipment Fund"
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Explain what you're raising funds for..."
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
          rows={5}
          disabled={isSubmitting}
        />
      </div>

      {/* Goal Amount */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Goal Amount (USD) <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="1"
            value={formData.goalAmount}
            onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
            placeholder="0.00"
            className="w-full bg-gray-800 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Deadline (Optional) */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Deadline (Optional)
        </label>
        <input
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          min={new Date().toISOString().split("T")[0]}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
          disabled={isSubmitting}
        />
        <p className="text-gray-500 text-xs mt-1">
          Leave blank for ongoing campaign
        </p>
      </div>

      {/* Image URL (Optional) */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          Campaign Image URL (Optional)
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating..." : "Create Campaign"}
      </button>
    </form>
  );
}