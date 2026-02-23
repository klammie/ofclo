// components/dashboard/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { signOut }   from "@/lib/auth/client";   // ← from better-auth/react, not next-auth
import type { SessionUser } from "@/lib/auth";

// Nav config and theme config stay identical — omitted for brevity
// (copy from previous implementation, no changes needed)

interface SidebarProps {
  user:     SessionUser;
  isOpen:   boolean;
  onToggle: () => void;
}

export function Sidebar({ user, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // user.role comes from BetterAuth's additionalFields config,
  // typed as string — cast to our union type
  const role = user.role as "admin" | "agency" | "creator" | "user";

  // ... same nav rendering as before ...

  return (
    <aside /* ... same styles ... */>
      {/* ... nav items ... */}

      {/* Sign out — calls BetterAuth client signOut */}
      <button
        onClick={() =>
          signOut({
            fetchOptions: {
              onSuccess: () => {
                window.location.href = "/login";
              },
            },
          })
        }
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold"
        style={{ background: "#ef444418", color: "#ef4444", border: "1px solid #ef444430" }}
      >
        <span>🚪</span>
        {isOpen && "Sign out"}
      </button>
    </aside>
  );
}