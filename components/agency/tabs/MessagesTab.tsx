"use client";

// components/agency/tabs/MessagesTab.tsx

import { useState, useEffect, useCallback } from "react";
import { AgencyMessageInterface } from "../AgencyMessageInterface";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relTime(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m`;
  if (h < 24)  return `${h}h`;
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Conversation {
  user_id:      string;
  user_name:    string;
  last_message: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

// ─── Conversation row ─────────────────────────────────────────────────────────
function ConvRow({ conv, isSelected, onClick }: {
  conv: Conversation; isSelected: boolean; onClick: () => void;
}) {
  const initial = (conv.user_name ?? "U").charAt(0).toUpperCase();
  const hasUnread = conv.unread_count > 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all active:scale-[0.98] border-l-2"
      style={{
        background:  isSelected ? "rgba(124,58,237,0.12)" : "transparent",
        borderColor: isSelected ? V : "transparent",
        minHeight:   72,
      }}>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="size-11 rounded-full flex items-center justify-center text-[15px] font-black text-white"
          style={{ background: GRAD }}>
          {initial}
        </div>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 bg-[#ef3976]"
            style={{ borderColor: SURF }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[13px] font-black truncate"
            style={{ color: hasUnread ? TEXT : "rgba(240,234,255,0.75)" }}>
            {conv.user_name || "User"}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {conv.last_message_at && (
              <span className="text-[10px] font-bold" style={{ color: hasUnread ? P : MUTED }}>
                {relTime(conv.last_message_at)}
              </span>
            )}
            {hasUnread && (
              <span className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1.5"
                style={{ background: GRAD }}>
                {conv.unread_count > 9 ? "9+" : conv.unread_count}
              </span>
            )}
          </div>
        </div>
        <p className="text-[12px] truncate"
          style={{ color: hasUnread ? "rgba(240,234,255,0.65)" : MUTED, fontWeight: hasUnread ? 600 : 400 }}>
          {conv.last_message || "No messages yet"}
        </p>
      </div>

      {/* Chevron on mobile */}
      <svg className="flex-shrink-0 opacity-20 lg:hidden" width="14" height="14"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function MessagesTab({ creatorUserId }: { creatorUserId: string }) {
  const [conversations,       setConversations]       = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading,            setIsLoading]            = useState(true);
  const [search,               setSearch]               = useState("");
  // On mobile: show chat view when a conv is selected
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/agency/messages/conversations?creatorUserId=${creatorUserId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, [creatorUserId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const selectConv = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMobileView("chat");
  };

  const filtered = conversations.filter((c) =>
    !search || (c.user_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-0" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Mobile: back button when in chat view ── */}
      {mobileView === "chat" && selectedConversation && (
        <button
          onClick={() => setMobileView("list")}
          className="lg:hidden flex items-center gap-2 px-2 pb-3 text-[13px] font-bold"
          style={{ color: V }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back to conversations
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>

        {/* ── Conversations list ── */}
        <div
          className={`rounded-[20px] border overflow-hidden flex flex-col ${mobileView === "chat" ? "hidden lg:flex" : "flex"}`}
          style={{ background: CARD, borderColor: BORDER }}>

          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b flex-shrink-0"
            style={{ borderColor: BORDER, background: SURF }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] font-black" style={{ color: TEXT }}>💬 Conversations</p>
              <span className="text-[10px] font-black rounded-full px-2 py-0.5"
                style={{ background: "rgba(124,58,237,0.15)", color: V }}>
                {conversations.length}
              </span>
            </div>
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5" viewBox="0 0 24 24"
                fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subscribers…"
                className="w-full rounded-xl border pl-9 pr-3 py-2 text-[12px] outline-none"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y"
            style={{ "--tw-divide-opacity": 1, borderColor: "rgba(124,58,237,0.06)" } as any}>
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-11 rounded-full" style={{ background: "rgba(124,58,237,0.1)" }} />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="h-3 w-28 rounded-full" style={{ background: "rgba(124,58,237,0.1)" }} />
                      <div className="h-2 w-40 rounded-full" style={{ background: "rgba(124,58,237,0.07)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
                <span className="text-3xl">💬</span>
                <p className="text-[13px] font-black" style={{ color: TEXT }}>
                  {search ? "No results" : "No conversations yet"}
                </p>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  {search ? "Try a different name" : "Subscribers who message this creator will appear here"}
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <ConvRow
                  key={conv.user_id}
                  conv={conv}
                  isSelected={selectedConversation?.user_id === conv.user_id}
                  onClick={() => selectConv(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className={`lg:col-span-2 ${mobileView === "list" ? "hidden lg:block" : "block"}`}>
          {selectedConversation ? (
            <AgencyMessageInterface
              creatorUserId={creatorUserId}
              subscriberUserId={selectedConversation.user_id}
              subscriberName={selectedConversation.user_name}
            />
          ) : (
            <div className="h-full rounded-[20px] border flex items-center justify-center"
              style={{ background: CARD, borderColor: BORDER }}>
              <div className="flex flex-col items-center gap-4 text-center px-8">
                <div className="size-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}` }}>
                  💬
                </div>
                <div>
                  <p className="text-[15px] font-black" style={{ color: TEXT }}>
                    Select a conversation
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                    Choose a subscriber from the list to start messaging as this creator
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}