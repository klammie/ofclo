// components/campaigns/CampaignCard.tsx
"use client";

import { useState } from "react";
import { DonateModal } from "./DonateModal";
import { TopDonorsModal } from "./TopDonorModal";

interface CampaignCardProps {
  campaign: any;
  creator?: any;
  isCreator?: boolean;
  currentUserId?: string | null;
}

export function CampaignCard({ campaign, creator, isCreator = false, currentUserId }: CampaignCardProps) {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showTopDonorsModal, setShowTopDonorsModal] = useState(false);

  const currentAmount = parseFloat(campaign.currentAmount || campaign.current_amount);
  const goalAmount = parseFloat(campaign.goalAmount || campaign.goal_amount);
  const progress = Math.min((currentAmount / goalAmount) * 100, 100);
  const isCompleted = campaign.status === "completed" || currentAmount >= goalAmount;
  const daysLeft = campaign.deadline 
    ? Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-pink-500/50 transition-all">
        {/* Campaign Image */}
        {campaign.imageUrl && (
          <div className="relative h-48 w-full">
            <img
              src={campaign.imageUrl || campaign.image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Status Badge */}
            {isCompleted && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                ✓ Completed
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {/* Creator Info (if showing to users) */}
          {creator && !isCreator && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {creator.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{creator.name}</div>
                <div className="text-gray-400 text-xs">@{creator.username}</div>
              </div>
            </div>
          )}

          {/* Title & Description */}
          <h3 className="text-white font-bold text-xl mb-2">{campaign.title}</h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-2xl">
                ${currentAmount.toLocaleString()}
              </span>
              <span className="text-gray-400 text-sm">
                of ${goalAmount.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{progress.toFixed(1)}% funded</span>
              {daysLeft !== null && (
                <span>{daysLeft} days left</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <span>{campaign.donorCount || campaign.donor_count} donors</span>
            </div>

            {(campaign.topDonorId || campaign.top_donor_id) && (
              <button
                onClick={() => setShowTopDonorsModal(true)}
                className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span className="text-xs font-semibold">Top Donors</span>
              </button>
            )}
          </div>

          {/* Actions */}
          {!isCreator && !isCompleted && (
            <button
              onClick={() => setShowDonateModal(true)}
              disabled={!currentUserId}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💰 Donate Now
            </button>
          )}

          {isCompleted && (
            <div className="text-center py-2 text-green-400 font-semibold">
              🎉 Goal Reached! Thank you to all donors!
            </div>
          )}
        </div>
      </div>

      {/* Donate Modal */}
      {showDonateModal && (
        <DonateModal
          campaign={campaign}
          creator={creator}
          onClose={() => setShowDonateModal(false)}
          onSuccess={() => {
            setShowDonateModal(false);
            window.location.reload();
          }}
        />
      )}

      {/* Top Donors Modal */}
      {showTopDonorsModal && (
        <TopDonorsModal
          campaignId={campaign.id}
          onClose={() => setShowTopDonorsModal(false)}
        />
      )}
    </>
  );
}