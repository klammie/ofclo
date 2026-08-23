"use client";

// components/campaigns/CreateCampaignButton.tsx
//
// For CREATORS creating their own campaign. No creator-picker step —
// the API resolves the creator from their session automatically.
//
// Usage (in creator dashboard):
//   import { CreateCampaignButton } from "@/components/campaigns/CreateCampaignButton";
//   <CreateCampaignButton onCreated={() => router.refresh()} />

import { useState } from "react";
import { CreateCampaignModal } from "./CreateCampaignModal";

const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V}, ${P})`;

interface CreateCampaignButtonProps {
  onCreated?: (campaign: any) => void;
  variant?: "full" | "icon";
}

export function CreateCampaignButton({ onCreated, variant = "full" }: CreateCampaignButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleCreated = (campaign: any) => {
    setShowModal(false);
    onCreated?.(campaign);
  };

  return (
    <>
      {variant === "full" ? (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)", fontFamily: "'Be Vietnam Pro', sans-serif" }}
        >
          🎯 New Campaign
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="size-10 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-[0.95]"
          style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
          title="New Campaign"
        >
          🎯
        </button>
      )}

      {showModal && (
        <CreateCampaignModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}