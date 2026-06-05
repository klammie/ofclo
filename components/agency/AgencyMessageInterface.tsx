"use client";

// components/agency/AgencyMessageInterface.tsx

import { useState, useEffect, useRef, useCallback } from "react";

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
function timeLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function relTime(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

interface Message {
  id:         string;
  content:    string | null;
  mediaUrl?:  string | null;
  mediaType?: string | null;
  createdAt:  string | null;
  // API may return camelCase OR snake_case — handle both
  fromUserId?: string;
  from_user_id?: string;
  toUserId?:   string;
  to_user_id?: string;
}

function getFromId(msg: Message): string {
  return msg.fromUserId ?? msg.from_user_id ?? "";
}

function getCreatedAt(msg: Message): string {
  return (msg.createdAt ?? (msg as any).created_at) || "";
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, isOwn, senderInitial }: {
  msg: Message; isOwn: boolean; senderInitial: string;
}) {
  const createdAt = getCreatedAt(msg);
  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — only for other side */}
      {!isOwn && (
        <div className="size-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black text-white mb-1"
          style={{ background: GRAD }}>
          {senderInitial}
        </div>
      )}

      <div className={`max-w-[68%] flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        {/* Media */}
        {msg.mediaUrl && (
          <div className="rounded-[14px] overflow-hidden max-w-[220px]">
            {msg.mediaType === "image"
              ? <img src={msg.mediaUrl} alt="Media" className="w-full rounded-[14px]" />
              : <video src={msg.mediaUrl} controls className="w-full rounded-[14px]"
                  controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
            }
          </div>
        )}

        {/* Text bubble */}
        {msg.content && (
          <div className="rounded-[18px] px-4 py-2.5"
            style={isOwn
              ? { background: GRAD, color: "#fff", borderBottomRightRadius: 4 }
              : { background: "rgba(255,255,255,0.07)", color: TEXT, borderBottomLeftRadius: 4 }
            }>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
              {msg.content}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] px-1" style={{ color: "rgba(240,234,255,0.3)" }}>
          {timeLabel(createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Date divider ─────────────────────────────────────────────────────────────
function DateDivider({ date }: { date: string | null | undefined }) {
  const label = dayLabel(date);
  if (!label) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: BORDER }} />
      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
        style={{ color: MUTED, background: "rgba(255,255,255,0.04)" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: BORDER }} />
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface Props {
  creatorUserId:   string;
  subscriberUserId: string;
  subscriberName:   string;
}

export function AgencyMessageInterface({ creatorUserId, subscriberUserId, subscriberName }: Props) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch(
        `/api/agency/messages/history?creatorUserId=${creatorUserId}&subscriberUserId=${subscriberUserId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [creatorUserId, subscriberUserId]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    // Optimistic
    const optimistic: Message = {
      id:         `opt-${Date.now()}`,
      content:    input.trim(),
      fromUserId: creatorUserId,
      toUserId:   subscriberUserId,
      createdAt:  new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch("/api/agency/messages/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          creatorUserId,
          toUserId: subscriberUserId,
          content:  optimistic.content,
        }),
      });
      if (!res.ok) {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else {
        // Refresh to get real message
        await fetchMessages();
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // Group messages by day
  const grouped: { date: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const created = getCreatedAt(msg);
    const d       = created ? new Date(created) : null;
    const day     = d && !isNaN(d.getTime()) ? d.toDateString() : "Unknown";
    const last    = grouped[grouped.length - 1];
    if (!last || last.date !== day) grouped.push({ date: day, msgs: [msg] });
    else last.msgs.push(msg);
  }

  // First letter of subscriber name for avatar
  const initial = subscriberName.charAt(0).toUpperCase();

  return (
    <div className="h-full flex flex-col rounded-[20px] border overflow-hidden"
      style={{ background: CARD, borderColor: BORDER, fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: BORDER, background: SURF }}>
        <div className="size-9 rounded-full flex items-center justify-center text-[14px] font-black text-white flex-shrink-0"
          style={{ background: GRAD }}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black truncate" style={{ color: TEXT }}>{subscriberName}</p>
          <p className="text-[10px]" style={{ color: MUTED }}>Subscriber · Messaging as creator</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-bold text-green-400">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className="rounded-[18px] h-10 w-40"
                  style={{ background: "rgba(124,58,237,0.1)" }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">💬</span>
            <p className="text-[14px] font-black" style={{ color: TEXT }}>No messages yet</p>
            <p className="text-[12px]" style={{ color: MUTED }}>Start the conversation as this creator</p>
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date} className="flex flex-col gap-2">
              <DateDivider date={getCreatedAt(msgs[0])} />
              {msgs.map((msg) => {
                const fromId = getFromId(msg);
                // isOwn = message was sent by the creator (agency impersonating)
                const isOwn  = fromId === creatorUserId || fromId === "";
                return (
                  <Bubble
                    key={msg.id}
                    msg={msg}
                    isOwn={isOwn}
                    senderInitial={initial}
                  />
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-t flex-shrink-0"
        style={{ borderColor: BORDER }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
          placeholder={`Message as ${subscriberName.split(" ")[0]}…`}
          disabled={sending}
          className="flex-1 bg-transparent outline-none text-[13px]"
          style={{ color: TEXT, fontFamily: "inherit" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-black text-white transition-all flex-shrink-0"
          style={{
            background: input.trim() && !sending ? GRAD : "rgba(124,58,237,0.15)",
            color:      input.trim() && !sending ? "#fff" : MUTED,
            cursor:     !input.trim() || sending ? "not-allowed" : "pointer",
          }}>
          {sending
            ? <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            : "Send"
          }
        </button>
      </div>
    </div>
  );
}