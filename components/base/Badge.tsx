// components/ui/Badge.tsx
"use client";

const COLORS: Record<string, string> = {
  active:       "#10b981",
  pending:      "#f59e0b",
  suspended:    "#ef4444",
  banned:       "#ef4444",
  cancelled:    "#6b7280",
  expired:      "#6b7280",
  sent:         "#10b981",
  processing:   "#3b82f6",
  failed:       "#ef4444",
  under_review: "#6366f1",
  resolved:     "#10b981",
  dismissed:    "#6b7280",
  vip:          "#f59e0b",
  standard:     "#6366f1",
};

interface BadgeProps {
  status: string;
  label?: string;
}

export function Badge({ status, label }: BadgeProps) {
  const color = COLORS[status] ?? "#6b7280";
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}