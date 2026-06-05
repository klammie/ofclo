// components/tips/TipModal.tsx
"use client";

import { useState } from "react";

interface TipModalProps {
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  postId?: string;
  messageId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TipModal({ creator, postId, messageId, onClose, onSuccess }: TipModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const presetAmounts = [5, 10, 20, 50, 100];

  async function handleSendTip() {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/tips/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          amount: parseFloat(amount),
          message: message.trim() || null,
          postId,
          messageId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send tip");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Send tip error:", error);
      alert(error.message || "Failed to send tip");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-xl">💰 Send Tip</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-800/50 rounded-lg">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {creator.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="text-white font-semibold">{creator.name}</div>
            <div className="text-gray-400 text-sm">@{creator.username}</div>
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm font-semibold mb-2">
            Quick Select
          </label>
          <div className="grid grid-cols-5 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className={`py-2 rounded-lg font-semibold transition-colors ${
                  amount === preset.toString()
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
                disabled={isProcessing}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm font-semibold mb-2">
            Custom Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm font-semibold mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a nice message..."
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
            rows={3}
            disabled={isProcessing}
            maxLength={200}
          />
          <p className="text-gray-500 text-xs mt-1">{message.length} / 200</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendTip}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Sending..." : `Send $${amount || "0.00"}`}
          </button>
        </div>

        <p className="text-gray-500 text-xs text-center mt-4">
          Tips are non-refundable and go directly to the creator
        </p>
      </div>
    </div>
  );
}