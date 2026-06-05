"use client";

import { useState } from "react";
import { useSettings } from "@/lib/hooks/use-settings";
import type { SettingsTab } from "@/lib/types";
import {
  ProfileTab, AccountTab, PrivacyTab,
  NotificationsTab, AppearanceTab, SecurityTab,
} from "@/components/settings/tabs/SettingsTab";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD = "#1a1635";
const SURF = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS: { id: SettingsTab; label: string; icon: string; description: string }[] = [
  { id: "profile",       label: "Profile",       icon: "👤", description: "Name, bio, avatar, banner" },
  { id: "account",       label: "Account",       icon: "⚙️", description: "Email, password, preferences" },
  { id: "privacy",       label: "Privacy",       icon: "🔒", description: "Visibility, messaging, blocking" },
  { id: "notifications", label: "Notifications", icon: "🔔", description: "In-app, email and push alerts" },
  { id: "appearance",    label: "Appearance",    icon: "🎨", description: "Theme, colours and layout" },
  { id: "security",      label: "Security",      icon: "🛡️", description: "2FA, sessions and login alerts" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-[16px] border h-24" style={{ background: CARD, borderColor: BORDER }} />
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function UserSettingsDashboard() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
    settings, isLoading, isSaving, savedTab, error,
    save, clearError,
  } = useSettings();

  const handleRevokeSession = async (sessionId: string) => {
    await fetch(`/api/user/settings/security`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  };

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;

  return (
    <div
      className="w-full max-w-5xl mx-auto flex flex-col gap-0"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: "#f0eaff" }}
    >
      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-[22px] font-black text-[#f0eaff] leading-tight">Settings</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(240,234,255,0.45)" }}>
          Manage your account, privacy, notifications and appearance
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3 mb-5"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span>
          <p className="flex-1 text-[12px] font-bold" style={{ color: P }}>{error}</p>
          <button onClick={clearError} className="text-[14px] opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Mobile tab selector — shown below md ── */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] border text-left transition-all"
          style={{ background: CARD, borderColor: BORDER }}>
          <span className="text-[18px]">{activeTabConfig.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black" style={{ color: "#f0eaff" }}>{activeTabConfig.label}</p>
            <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.4)" }}>{activeTabConfig.description}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="rgba(240,234,255,0.4)" strokeWidth="2" strokeLinecap="round"
            style={{ transform: mobileNavOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {/* Dropdown */}
        {mobileNavOpen && (
          <div className="mt-1 rounded-[16px] border overflow-hidden"
            style={{ background: CARD, borderColor: BORDER, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            {TABS.map((tab) => {
              const isActive  = activeTab === tab.id;
              const wasSaved  = savedTab === tab.id;
              return (
                <button key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b last:border-b-0 transition-all"
                  style={{
                    background:  isActive ? "rgba(124,58,237,0.12)" : "transparent",
                    borderColor: "rgba(124,58,237,0.08)",
                    borderLeft:  isActive ? `3px solid ${V}` : "3px solid transparent",
                  }}>
                  <span className="text-[18px]">{tab.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-black" style={{ color: isActive ? "#f0eaff" : "rgba(240,234,255,0.6)" }}>
                        {tab.label}
                      </p>
                      {wasSaved && (
                        <span className="text-[9px] font-black px-1.5 py-px rounded-full"
                          style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>✓</span>
                      )}
                    </div>
                    <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>{tab.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* ── Desktop left nav — hidden below lg ── */}
        <nav className="hidden lg:block lg:w-56 flex-shrink-0">
          <div className="flex flex-col gap-1">
            {TABS.map((tab) => {
              const isActive  = activeTab === tab.id;
              const wasSaved  = savedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 w-full"
                  style={isActive
                    ? { background: "rgba(124,58,237,0.12)", border: `1px solid ${V}40` }
                    : { background: "transparent", border: "1px solid transparent" }
                  }
                >
                  <span className="text-[16px] flex-shrink-0">{tab.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-black truncate" style={{ color: isActive ? "#f0eaff" : "rgba(240,234,255,0.55)" }}>
                        {tab.label}
                      </p>
                      {wasSaved && (
                        <span className="text-[9px] font-black px-1.5 py-px rounded-full flex-shrink-0"
                          style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>✓</span>
                      )}
                    </div>
                    <p className="text-[10px] truncate" style={{ color: "rgba(240,234,255,0.3)" }}>
                      {tab.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: GRAD }} />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Tab content ── */}
        <div className="flex-1 min-w-0">
          {isLoading || !settings ? (
            <Skeleton />
          ) : (
            <>
              {activeTab === "profile" && (
                <ProfileTab
                  initial={settings.profile}
                  onSave={(d) => save("profile", d)}
                  isSaving={isSaving && savedTab === null}
                  saved={savedTab === "profile"}
                />
              )}
              {activeTab === "account" && (
                <AccountTab
                  initial={settings.account}
                  onSave={(d) => save("account", d)}
                  isSaving={isSaving}
                  saved={savedTab === "account"}
                />
              )}
              {activeTab === "privacy" && (
                <PrivacyTab
                  initial={settings.privacy}
                  onSave={(d) => save("privacy", d)}
                  isSaving={isSaving}
                  saved={savedTab === "privacy"}
                />
              )}
              {activeTab === "notifications" && (
                <NotificationsTab
                  initial={settings.notifications}
                  onSave={(d) => save("notifications", d)}
                  isSaving={isSaving}
                  saved={savedTab === "notifications"}
                />
              )}
              {activeTab === "appearance" && (
                <AppearanceTab
                  initial={settings.appearance}
                  onSave={(d) => save("appearance", d)}
                  isSaving={isSaving}
                  saved={savedTab === "appearance"}
                />
              )}
              {activeTab === "security" && (
                <SecurityTab
                  initial={settings.security}
                  onRevokeSession={handleRevokeSession}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}