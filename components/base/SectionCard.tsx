// components/ui/SectionCard.tsx
"use client";

import type { ReactNode } from "react";

interface SectionCardProps {
  title:       string;
  action?:     string;
  onAction?:   () => void;
  children:    ReactNode;
  accentColor?: string;
}

export function SectionCard({
  title, action, onAction, children, accentColor = "#6366f1",
}: SectionCardProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#14142b", border: "1px solid #2a2a4a" }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #2a2a4a" }}
      >
        <h3 className="text-white font-bold text-sm">{title}</h3>
        {action && (
          <button
            onClick={onAction}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background:  `${accentColor}20`,
              color:        accentColor,
              border:       `1px solid ${accentColor}40`,
            }}
          >
            {action}
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}