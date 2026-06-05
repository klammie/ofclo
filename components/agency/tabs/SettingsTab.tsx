// components/agency/tabs/SettingsTab.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsTab({ creator, agencyId }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    standardPrice: creator.standardPrice || "",
    vipPrice: creator.vipPrice || "",
    isVerified: creator.isVerified || false,
  });

  async function handleUpdatePricing(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/agency/creators/${creator.id}/update-pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardPrice: parseFloat(formData.standardPrice),
          vipPrice: parseFloat(formData.vipPrice),
        }),
      });

      if (response.ok) {
        alert("Pricing updated successfully");
        router.refresh();
      } else {
        alert("Failed to update pricing");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update pricing");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleToggleVerification() {
    try {
      const response = await fetch(`/api/agency/creators/${creator.id}/toggle-verification`, {
        method: "POST",
      });

      if (response.ok) {
        setFormData({ ...formData, isVerified: !formData.isVerified });
        router.refresh();
      } else {
        alert("Failed to update verification");
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("Failed to update verification");
    }
  }

  async function handleRemoveCreator() {
    if (!confirm("Remove this creator from your agency? They will keep their account but you will no longer manage them.")) {
      return;
    }

    try {
      const response = await fetch(`/api/agency/creators/${creator.id}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });

      if (response.ok) {
        router.push("/dashboard/agency");
      } else {
        alert("Failed to remove creator");
      }
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove creator");
    }
  }

  return (
    <div className="space-y-6">
      {/* Pricing Settings */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-xl mb-4">💰 Subscription Pricing</h3>
        <form onSubmit={handleUpdatePricing} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Standard Price (USD/month)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.standardPrice}
                  onChange={(e) => setFormData({ ...formData, standardPrice: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                VIP Price (USD/month)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.vipPrice}
                  onChange={(e) => setFormData({ ...formData, vipPrice: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-3 rounded-lg bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Pricing"}
          </button>
        </form>
      </div>

      {/* Verification */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-xl mb-4">✓ Verification</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold mb-1">Verified Badge</p>
            <p className="text-gray-400 text-sm">Show verification checkmark on profile</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isVerified}
              onChange={handleToggleVerification}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/30 p-6">
        <h3 className="text-red-400 font-bold text-xl mb-4">⚠️ Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold mb-1">Remove Creator</p>
              <p className="text-gray-400 text-sm">
                Remove this creator from your agency management
              </p>
            </div>
            <button
              onClick={handleRemoveCreator}
              className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}