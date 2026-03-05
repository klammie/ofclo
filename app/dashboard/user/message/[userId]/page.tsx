// app/dashboard/user/message/[userId]/page.tsx
// ❌ Remove this if it exists:
// import Image from "next/image";

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
  const session = await requireRole("creator", "user", "agency");
  const { userId: otherUserId } = await params;
  const isCreator = session.user.role === "creator";

  // Get other user details
  const [otherUserData] = await db
    .select({
      user: user,
      profile: profiles,
    })
    .from(user)
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(user.id, otherUserId))
    .limit(1);

  if (!otherUserData) {
    redirect("/dashboard/user/messages");
  }

  // Get message history
  const messageHistory = await getMessageHistoryWithUnlocks(session.user.id, otherUserId, 50);


  const otherUser = {
    id: otherUserData.user.id,
    name: otherUserData.user.name,
    username: otherUserData.profile?.username || otherUserData.user.email.split('@')[0],
    avatarUrl: otherUserData.profile?.avatarUrl || otherUserData.user.image || null,
  };

  return (
    <div className="h-screen bg-linear-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Back button */}
        <div className="p-4">
          <Link
            href="/dashboard/user/messages"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to messages
          </Link>
        </div>

        {/* Chat window */}
        <div className="flex-1 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 mx-4 mb-4 overflow-hidden">
          <ChatWindow
  otherUser={otherUser}
  initialMessages={messageHistory}  // ✅ Pass directly
  currentUserId={session.user.id}
  isCreator={isCreator}
/>
        </div>
      </div>
    </div>
  );
}