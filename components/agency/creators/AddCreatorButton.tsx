// components/agency/creators/AddCreatorButton.tsx
"use client";

import { useState } from "react";
import { CreateCreatorModal } from "./CreateCreatorModal";

const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V}, ${P})`;
const TEXT = "#f0eaff";

interface AddCreatorButtonProps {
  onCreated: (creator: any) => void;
}

export function AddCreatorButton({ onCreated }: AddCreatorButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{
          background: GRAD,
          boxShadow:  "0 4px 14px rgba(124,58,237,0.35)",
          fontFamily: "'Be Vietnam Pro', sans-serif",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={TEXT} strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Creator
      </button>

      {open && (
        <CreateCreatorModal
          onClose={() => setOpen(false)}
          onCreated={(creator) => {
            setOpen(false);
            onCreated(creator);
          }}
        />
      )}
    </>
  );
}