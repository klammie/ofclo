// components/agency/ApplicationCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApplicationCard({ application }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  async function handleApprove() {
    if (!confirm(`Approve ${application.display_name} as a creator?`)) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/agency/applications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.id,
          action: "approve",
        }),
      });

      if (!response.ok) throw new Error("Failed to approve");

      router.refresh();
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve application");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject(reason: string) {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/agency/applications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.id,
          action: "reject",
          reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      setShowRejectModal(false);
      router.refresh();
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject application");
    } finally {
      setIsProcessing(false);
    }
  }

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <>
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white font-bold text-xl">{application.display_name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[application.status]}`}>
                {application.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {application.user_name} • {application.user_email}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Applied {new Date(application.created_at).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">Content Type</div>
            <div className="text-white font-semibold capitalize">{application.content_type}</div>
          </div>
          {application.expected_revenue && (
            <div>
              <div className="text-gray-400 text-xs mb-1">Expected Revenue</div>
              <div className="text-white font-semibold">{application.expected_revenue}</div>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 mb-4 pt-4 border-t border-white/10">
            {/* Bio */}
            <div>
              <div className="text-gray-400 text-sm font-semibold mb-2">Bio</div>
              <p className="text-white">{application.bio}</p>
            </div>

            {/* Why */}
            <div>
              <div className="text-gray-400 text-sm font-semibold mb-2">Why Creator?</div>
              <p className="text-white">{application.why}</p>
            </div>

            {/* Social Links */}
            {application.social_links && (
              <div>
                <div className="text-gray-400 text-sm font-semibold mb-2">Social Media</div>
                <p className="text-white">{application.social_links}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {application.status === "pending" && (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              ✕ Reject
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          onReject={handleReject}
          onCancel={() => setShowRejectModal(false)}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}

function RejectModal({ onReject, onCancel, isProcessing }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-md w-full">
        <h3 className="text-white font-bold text-xl mb-4">Reject Application</h3>
        
        <div className="mb-4">
          <label className="block text-gray-400 text-sm font-semibold mb-2">
            Reason for rejection
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide feedback for the applicant..."
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
            rows={4}
            disabled={isProcessing}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onReject(reason)}
            disabled={isProcessing || !reason.trim()}
            className="flex-1 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}