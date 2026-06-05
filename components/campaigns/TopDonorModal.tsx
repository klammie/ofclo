// components/campaigns/TopDonorsModal.tsx
"use client";

import { useState, useEffect } from "react";

export function TopDonorsModal({ campaignId, onClose }) {
  const [topDonors, setTopDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTopDonors() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/top-donors`);
        if (response.ok) {
          const data = await response.json();
          setTopDonors(data.topDonors);
        }
      } catch (error) {
        console.error("Failed to fetch top donors:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopDonors();
  }, [campaignId]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-xl">⭐ Top Donors</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Donors List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : topDonors.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No donations yet</div>
        ) : (
          <div className="space-y-3">
            {topDonors.map((donor, index) => (
              <div
                key={donor.user_id}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? "bg-yellow-500 text-black" :
                  index === 1 ? "bg-gray-400 text-black" :
                  index === 2 ? "bg-orange-600 text-white" :
                  "bg-gray-700 text-gray-400"
                }`}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                  {donor.avatar_url ? (
                    <img src={donor.avatar_url} alt={donor.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {donor.user_name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm">
                    {donor.is_anonymous ? "Anonymous" : donor.user_name}
                  </div>
                  <div className="text-gray-400 text-xs">{donor.donation_count} donations</div>
                </div>

                {/* Amount */}
                <div className="text-pink-400 font-bold">
                  ${parseFloat(donor.total_amount).toLocaleString()}
                </div>

                {/* Badge */}
                {index === 0 && (
                  <div className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                    👑 TOP FAN
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}