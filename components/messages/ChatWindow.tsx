"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const BORDER = "rgba(124,58,237,0.15)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  isPpv?: boolean;
  ppvPrice?: string | number | null;
  isRead: boolean;
  createdAt: string | Date;
  isUnlocked?: boolean;
}

interface OtherUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Ensure a date string is treated as UTC (add Z if missing timezone info)
function toUTC(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  // If it's a plain datetime without timezone (e.g. "2026-05-01 14:32:00"), add Z
  const str = date.trim().replace(" ", "T");
  const withZ = str.endsWith("Z") || str.includes("+") ? str : `${str}Z`;
  const d = new Date(withZ);
  return isNaN(d.getTime()) ? null : d;
}

function relTime(date: string | Date | null | undefined): string {
  const d = toUTC(date);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeLabel(date: string | Date | null | undefined): string {
  const d = toUTC(date);
  if (!d) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
const GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function avatarGrad(id: string) {
  return GRADIENTS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, otherUser }: {
  msg: Message; isOwn: boolean; otherUser: OtherUser;
}) {
  const isPpvLocked = msg.isPpv && !msg.isUnlocked && !isOwn;

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Other user avatar */}
      {!isOwn && (
        <div className="size-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[10px]"
          style={{
            background: otherUser.avatarUrl ? "transparent" : avatarGrad(otherUser.id),
            border: "1.5px solid rgba(124,58,237,0.3)",
          }}>
          {otherUser.avatarUrl
            ? <img src={otherUser.avatarUrl} alt={otherUser.name} className="size-full object-cover" />
            : otherUser.name.charAt(0).toUpperCase()
          }
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[68%] flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>

        {/* PPV locked */}
        {isPpvLocked ? (
          <div className="rounded-[16px] border overflow-hidden"
            style={{ background: "rgba(239,57,118,0.07)", borderColor: "rgba(239,57,118,0.25)", minWidth: 180 }}>
            <div className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">🔒</span>
                <span className="text-[12px] font-black" style={{ color: TEXT }}>Exclusive Content</span>
              </div>
              {msg.ppvPrice && (
                <p className="text-[11px]" style={{ color: MUTED }}>
                  Unlock for ${typeof msg.ppvPrice === "string" ? parseFloat(msg.ppvPrice).toFixed(2) : msg.ppvPrice}
                </p>
              )}
              <button
                className="w-full py-2 rounded-xl text-[11px] font-black text-white"
                style={{ background: GRAD }}
                onClick={async () => {
                  await fetch("/api/messages/unlock-ppv", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messageId: msg.id }),
                  });
                  window.location.reload();
                }}
              >
                Unlock · ${typeof msg.ppvPrice === "string" ? parseFloat(msg.ppvPrice).toFixed(2) : msg.ppvPrice}
              </button>
            </div>
          </div>

        ) : msg.mediaUrl ? (
          /* Media message */
          <div className="rounded-[16px] overflow-hidden"
            style={{ border: `1px solid ${BORDER}`, maxWidth: 260 }}>
            {msg.mediaType === "video" ? (
              <video src={msg.mediaUrl} controls className="w-full max-h-64 object-cover"
                controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
            ) : (
              <img src={msg.mediaUrl} alt="Media" className="w-full max-h-64 object-cover" />
            )}
            {msg.content && (
              <p className="px-3 py-2 text-[12px]" style={{ color: TEXT, background: isOwn ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)" }}>
                {msg.content}
              </p>
            )}
          </div>

        ) : (
          /* Text message */
          <div
            className="px-4 py-2.5 rounded-[16px]"
            style={isOwn
              ? { background: GRAD, borderRadius: "16px 16px 4px 16px" }
              : { background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, borderRadius: "16px 16px 16px 4px" }
            }
          >
            <p className="text-[13px] leading-snug whitespace-pre-wrap break-words"
              style={{ color: isOwn ? "#fff" : TEXT }}>
              {msg.content}
            </p>
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[9px]" style={{ color: "rgba(240,234,255,0.25)" }}>
            {timeLabel(msg.createdAt)}
          </span>
          {isOwn && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={msg.isRead ? V : "rgba(240,234,255,0.25)"}
              strokeWidth="2.5" strokeLinecap="round">
              {msg.isRead
                ? <><path d="M2 12l5 5L20 4"/><path d="M9 12l5 5L20 4" /></>
                : <path d="M2 12l5 5L20 4"/>
              }
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Date divider ─────────────────────────────────────────────────────────────
function DateDivider({ date }: { date: string | Date | null | undefined }) {
  if (!date) return null;
  const d = toUTC(date);
  if (!d) return null;
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString())          label = "Today";
  else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
  else label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: BORDER }} />
      <span className="text-[10px] font-black uppercase tracking-wider"
        style={{ color: "rgba(240,234,255,0.25)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: BORDER }} />
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-7 rounded-full flex-shrink-0" style={{ background: "rgba(124,58,237,0.2)" }} />
      <div className="flex items-center gap-1 px-4 py-3 rounded-[16px]"
        style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}` }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 rounded-full" style={{
            background: MUTED,
            animation: `bounce 1.2s infinite ${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface ChatWindowProps {
  otherUser: OtherUser;
  initialMessages: Message[];
  currentUserId: string;
  isCreator?: boolean;
}

export function ChatWindow({ otherUser, initialMessages, currentUserId, isCreator }: ChatWindowProps) {
  // Sanitize initialMessages — fix null createdAt from old DB rows
  const sanitized = initialMessages.map((m) => ({
    ...m,
    createdAt: m.createdAt || new Date().toISOString(),
  }));
  const [messages,  setMessages]  = useState<Message[]>(sanitized);
  const [input,     setInput]     = useState("");
  const [isSending, setSending]   = useState(false);
  const [isTyping,  setIsTyping]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Group messages by date for dividers
  const grouped = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
    const d   = msg.createdAt ? new Date(msg.createdAt) : null;
    const day = d && !isNaN(d.getTime()) ? d.toDateString() : "Unknown";
    const last = acc[acc.length - 1];
    if (!last || last.date !== day) acc.push({ date: day, msgs: [msg] });
    else last.msgs.push(msg);
    return acc;
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setSending(true);
    setInput("");

    // Optimistic update
    const optimistic: Message = {
      id:          `opt-${Date.now()}`,
      fromUserId:  currentUserId,
      toUserId:    otherUser.id,
      content:     text,
      isRead:      false,
      createdAt:   new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res  = await fetch("/api/messages/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ toUserId: otherUser.id, content: text }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => prev.map((m) => m.id === optimistic.id ? message : m));
      }
    } catch {}
    finally { setSending(false); }
  }, [input, isSending, currentUserId, otherUser.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
            <div className="size-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}` }}>
              👋
            </div>
            <p className="text-[14px] font-black" style={{ color: TEXT }}>Say hello to {otherUser.name}</p>
            <p className="text-[12px]" style={{ color: MUTED }}>Start the conversation!</p>
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date} className="flex flex-col gap-2.5">
              <DateDivider date={msgs[0].createdAt} />
              {msgs.map((msg) => {
                // Primary: fromUserId matches session user
                // Fallback: if fromUserId is missing, assume own if toUserId is the other user
                const isOwn = msg.fromUserId
                  ? msg.fromUserId === currentUserId
                  : msg.toUserId === otherUser.id;
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={{
                      ...msg,
                      // Ensure createdAt is never null — fallback to now so no "Invalid Date"
                      createdAt: msg.createdAt || new Date().toISOString(),
                    }}
                    isOwn={isOwn}
                    otherUser={otherUser}
                  />
                );
              })}
            </div>
          ))
        )}

        {isTyping && <TypingIndicator name={otherUser.name} />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t"
        style={{ borderColor: BORDER, background: "#13112b" }}>
        <div className="flex items-end gap-3">

          {/* Attachment button */}
          <button
            className="size-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}`, color: MUTED }}
            title="Attach media"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser.name}…`}
              rows={1}
              maxLength={2000}
              className="w-full rounded-2xl border px-4 py-2.5 text-[13px] outline-none resize-none leading-snug"
              style={{
                background:  "rgba(255,255,255,0.05)",
                borderColor: input ? "rgba(124,58,237,0.4)" : BORDER,
                color:       TEXT,
                fontFamily:  "inherit",
                maxHeight:   120,
                transition:  "border-color 0.15s",
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="size-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 transition-all"
            style={{
              background: input.trim() ? GRAD : "rgba(124,58,237,0.15)",
              boxShadow:  input.trim() ? "0 4px 12px rgba(124,58,237,0.35)" : "none",
              border:     "none",
              cursor:     input.trim() && !isSending ? "pointer" : "not-allowed",
              opacity:    isSending ? 0.6 : 1,
            }}
            title="Send message (Enter)"
          >
            {isSending ? (
              <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() ? "#fff" : MUTED} strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="text-[9px] mt-1.5 pl-12" style={{ color: "rgba(240,234,255,0.2)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}