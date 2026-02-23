// components/user/FeedCard.tsx  (updated unlock flow)
"use client";

import { useState, useTransition } from "react";
import type { PostWithAccess } from "@/lib/types";

export function FeedCard({ post, userId }: { post: PostWithAccess; userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ACCENT = "#3b82f6";

  function handleUnlock() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkout/ppv", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId: post.id }),
      });

      const data = await res.json();

      if (data.alreadyUnlocked) {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Could not initiate payment.");
        return;
      }

      // Send user to MaxelPay-hosted crypto checkout
      window.location.href = data.checkoutUrl;
    });
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#14142b", border: "1px solid #2a2a4a" }}>
      {/* header / media / caption — same as before */}

      {!post.isUnlocked && post.ppvPrice && (
        <div className="px-4 pb-4">
          {error && (
            <p className="text-red-400 text-xs mb-2">{error}</p>
          )}
          <button
            disabled={isPending}
            onClick={handleUnlock}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: ACCENT }}
          >
            {isPending
              ? "Redirecting to checkout…"
              : `🔓 Unlock for $${Number(post.ppvPrice).toFixed(2)} crypto`
            }
          </button>
          <p className="text-center text-gray-600 text-[11px] mt-2">
            Pay with ETH, USDT, BNB + 100 others · Powered by MaxelPay
          </p>
        </div>
      )}
    </div>
  );
}