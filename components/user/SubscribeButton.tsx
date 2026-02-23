// components/user/SubscribeButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
  creatorId:    string;
  creatorName:  string;
  standardPrice: number;
  vipPrice:     number;
  isSubscribed: boolean;
  accentColor?: string;
}

export function SubscribeButton({
  creatorId,
  creatorName,
  standardPrice,
  vipPrice,
  isSubscribed,
  accentColor = "#3b82f6",
}: SubscribeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTier, setSelectedTier] = useState<"standard" | "vip">("standard");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  function handleSubscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/checkout/subscribe", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ creatorId, tier: selectedTier }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Subscription failed. Please try again.");
          return;
        }

        // Redirect to MaxelPay hosted checkout page
        // User picks their crypto (ETH, USDT, BNB, etc.) on MaxelPay's UI
        window.location.href = data.checkoutUrl;

      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  if (isSubscribed) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
        style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
      >
        ✓ Subscribed
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ background: accentColor }}
      >
        💎 Subscribe with Crypto
      </button>

      {/* Tier selection modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#14142b", border: "1px solid #2a2a4a" }}
          >
            <h3 className="text-white font-black text-lg mb-1">
              Subscribe to {creatorName}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Pay with ETH, USDT, BNB or 100+ cryptocurrencies via MaxelPay.
              No KYC required.
            </p>

            {/* Tier options */}
            <div className="flex flex-col gap-3 mb-6">
              {(["standard", "vip"] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className="flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left"
                  style={{
                    borderColor: selectedTier === tier ? accentColor : "#2a2a4a",
                    background:  selectedTier === tier ? `${accentColor}15` : "transparent",
                  }}
                >
                  <div>
                    <div className="text-white font-bold capitalize">{tier}</div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {tier === "vip" ? "Full access + priority DMs" : "Basic content access"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-lg">
                      ${tier === "vip" ? vipPrice : standardPrice}
                    </div>
                    <div className="text-gray-600 text-xs">/ month</div>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-400/10 rounded-lg p-3">{error}</p>
            )}

            {/* Supported cryptos */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {["ETH", "USDT", "BNB", "MATIC", "BTC"].map(c => (
                <span
                  key={c}
                  className="text-[10px] font-bold px-2 py-1 rounded-md"
                  style={{ background: "#ffffff10", color: "#888" }}
                >
                  {c}
                </span>
              ))}
              <span className="text-[10px] text-gray-600">+100 more</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setError(null); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-gray-400 border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleSubscribe}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-50"
                style={{ background: accentColor }}
              >
                {isPending ? "Redirecting…" : "Pay with Crypto →"}
              </button>
            </div>

            <p className="text-center text-gray-600 text-[11px] mt-4">
              Powered by MaxelPay · 0.4% fee · No KYC
            </p>
          </div>
        </div>
      )}
    </>
  );
}