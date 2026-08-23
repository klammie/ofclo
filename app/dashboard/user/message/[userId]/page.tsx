// app/dashboard/user/message/[userId]/page.tsx

import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { user, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMessageHistoryWithUnlocks } from "@/lib/queries/message";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session     = await requireRole("creator", "user", "agency");
  const { userId: otherUserId } = await params;
  const isCreator   = session.user.role === "creator";

  const [otherUserData] = await db
    .select({ user: user, profile: profiles })
    .from(user)
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(user.id, otherUserId))
    .limit(1);

  if (!otherUserData) redirect("/dashboard/user/messages");

  const messageHistory = await getMessageHistoryWithUnlocks(session.user.id, otherUserId, 50);

  const otherUser = {
    id:        otherUserData.user.id,
    name:      otherUserData.user.name,
    username:  otherUserData.profile?.username ?? otherUserData.user.email.split("@")[0],
    avatarUrl: otherUserData.profile?.avatarUrl ?? otherUserData.user.image ?? null,
  };

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        height: "calc(100dvh - 64px)",    // dvh accounts for mobile browser chrome
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* ── Chat header — sticky so back button always visible ── */}
      <div
        className="flex items-center gap-4 px-5 py-3.5 border-b rounded-t-[20px] flex-shrink-0 sticky top-0 z-10"
        style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.18)" }}
      >
        {/* Back */}
        <Link
          href="/dashboard/user/message"
          className="size-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "rgba(240,234,255,0.7)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Avatar */}
        <div
          className="size-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[14px]"
          style={{
            border: "2px solid rgba(124,58,237,0.4)",
            background: otherUser.avatarUrl ? "transparent" : "linear-gradient(135deg,#7c3aed,#ef3976)",
          }}
        >
          {otherUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.avatarUrl} alt={otherUser.name} className="size-full object-cover" />
          ) : (
            otherUser.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Name + username */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black text-[#f0eaff] truncate">{otherUser.name}</p>
          <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.4)" }}>@{otherUser.username}</p>
        </div>

        {/* Online indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="size-2 rounded-full bg-green-400" />
          <span className="text-[11px] font-bold text-green-400">Online</span>
        </div>
      </div>

      {/* ── Chat window ── */}
      <div
        className="flex-1 min-h-0 rounded-b-[20px] overflow-hidden"
        style={{ background: "#1a1635", borderLeft: "1px solid rgba(124,58,237,0.18)", borderRight: "1px solid rgba(124,58,237,0.18)", borderBottom: "1px solid rgba(124,58,237,0.18)" }}
      >
        <ChatWindow
          otherUser={otherUser}
          initialMessages={messageHistory}
          currentUserId={session.user.id}
          isCreator={isCreator}
        />
      </div>
    </div>
  );
}