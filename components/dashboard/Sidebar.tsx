// components/dashboard/Sidebar.tsx
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import type { SessionUser } from "@/lib/auth";
import Image from "next/image";

interface SidebarProps {
  user: SessionUser;
  isOpen?: boolean;
  onToggle?: () => void;
}

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  roles: Array<"admin" | "agency" | "creator" | "user">;
};

// Navigation items for all roles
const NAV_ITEMS: NavItem[] = [
  // ─── Admin Routes ────────────────────────────────────────────────────────
  {
    label: "Overview",
    href: "/dashboard/admin",
    icon: "📊",
    roles: ["admin"],
  },
  {
    label: "Creators",
    href: "/dashboard/admin/creators",
    icon: "⭐",
    roles: ["admin"],
  },
  {
    label: "Agencies",
    href: "/dashboard/admin/agencies",
    icon: "🏢",
    roles: ["admin"],
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: "👥",
    roles: ["admin"],
  },
  {
    label: "Reports",
    href: "/dashboard/admin/reports",
    icon: "🚩",
    badge: "new",
    roles: ["admin"],
  },
  {
    label: "Payouts",
    href: "/dashboard/admin/payouts",
    icon: "💸",
    roles: ["admin"],
  },
  {
    label: "Settings",
    href: "/dashboard/admin/settings",
    icon: "⚙️",
    roles: ["admin"],
  },

  // ─── Agency Routes ───────────────────────────────────────────────────────
  {
    label: "Overview",
    href: "/dashboard/agency",
    icon: "📊",
    roles: ["agency"],
  },
  {
    label: "My Creators",
    href: "/dashboard/agency/creators",
    icon: "⭐",
    roles: ["agency"],
  },
  {
    label: "Analytics",
    href: "/dashboard/agency/analytics",
    icon: "📈",
    roles: ["agency"],
  },
  {
    label: "Commissions",
    href: "/dashboard/agency/payouts",
    icon: "💰",
    roles: ["agency"],
  },
  {
    label: "Messages",
    href: "/dashboard/agency/messages",
    icon: "💬",
    roles: ["agency"],
  },
  {
    label: "Settings",
    href: "/dashboard/agency/settings",
    icon: "⚙️",
    roles: ["agency"],
  },

  // ─── Creator Routes ──────────────────────────────────────────────────────
  {
    label: "Overview",
    href: "/dashboard/creator",
    icon: "🏠",
    roles: ["creator"],
  },
  {
    label: "Content",
    href: "/dashboard/creator/content",
    icon: "📸",
    roles: ["creator"],
  },
  {
    label: "Upload Media",
    href: "/dashboard/creator/upload",
    icon: "⬆️",
    roles: ["creator"],
  },
  {
    label: "Subscribers",
    href: "/dashboard/creator/subscribers",
    icon: "👥",
    roles: ["creator"],
  },
  {
    label: "Messages",
    href: "/dashboard/creator/message",
    icon: "💬",
    badge: 3,
    roles: ["creator"],
  },
  {
    label: "Earnings",
    href: "/dashboard/creator/earnings",
    icon: "💵",
    roles: ["creator"],
  },
  {
    label: "Settings",
    href: "/dashboard/creator/settings",
    icon: "⚙️",
    roles: ["creator"],
  },

  // ─── User/Fan Routes ─────────────────────────────────────────────────────
  {
  label: "Feed",
  href: "/dashboard/user/feed",
  icon: "🏠",
  roles: ["user"],
  },
  {
    label: "Discover",
    href: "/dashboard/user/discover",
    icon: "🔍",
    roles: ["user"],
  },
  {
    label: "Subscriptions",
    href: "/dashboard/user/subscriptions",
    icon: "⭐",
    roles: ["user"],
  },
  {
    label: "Messages",
    href: "/dashboard/user/message",
    icon: "💬",
    badge: 5,
    roles: ["user"],
  },
  {
    label: "Wallet",
    href: "/dashboard/user/wallet",
    icon: "💳",
    roles: ["user"],
  },
  {
    label: "Settings",
    href: "/dashboard/user/settings",
    icon: "⚙️",
    roles: ["user"],
  },
];

export function Sidebar({ user, isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userRole = user.role as "admin" | "agency" | "creator" | "user";

  // Filter nav items by user's role
  const visibleNavItems = NAV_ITEMS.filter(item => 
    item.roles.includes(userRole)
  );

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
          },
          onError: (error) => {
            console.error("Sign out failed:", error);
            setIsSigningOut(false);
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  }

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-40
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-64" : "w-20"}
        bg-liear-to-b from-gray-900 via-gray-900 to-black
        border-r border-white/10
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className={`flex items-center gap-3 ${!isOpen && "justify-center w-full"}`}>
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-black text-lg">F</span>
          </div>
          {isOpen && (
            <span className="text-white font-black text-xl">Social X</span>
          )}
        </div>
        
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isOpen ? "◀" : "▶"}
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-white/10">
        <div className={`flex items-center gap-3 ${!isOpen && "justify-center"}`}>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User info */}
          {isOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {user.name}
              </div>
              <div className="text-gray-400 text-xs capitalize">
                {userRole}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard/user" && 
               item.href !== "/dashboard/creator" && 
               item.href !== "/dashboard/agency" && 
               item.href !== "/dashboard/admin" && 
               pathname.startsWith(item.href));

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? "bg-linear-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                  ${!isOpen && "justify-center"}
                `}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                
                {isOpen && (
                  <>
                    <span className="flex-1 font-medium text-sm">
                      {item.label}
                    </span>
                    
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-gray-400 hover:text-white hover:bg-red-500/10
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${!isOpen && "justify-center"}
          `}
        >
          <span className="text-lg">🚪</span>
          {isOpen && (
            <span className="flex-1 text-left font-medium text-sm">
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}