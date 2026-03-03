// app/dashboard/user/messages/[userId]/page.tsx
// Individual chat page with specific user

import { requireRole } from "@/lib/auth/guard";
import { getMessageHistory } from "@/lib/queries/message";
import { db } from "@/db";
import { user, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireRole("user", "creator", "agency");

  // ✅ unwrap params
  const { userId: otherUserId } = await params;

  // Get other user details
  const [otherUser] = await db
    .select({
      user: user,
      profile: profiles,
    })
    .from(user)
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(user.id, otherUserId))
    .limit(1);

  if (!otherUser) {
    redirect("/dashboard/user/messages");
  }

  // Get message history
  const messageHistory = await getMessageHistory(
    session.user.id,
    otherUserId,
    50
  );

  const formattedMessages = messageHistory.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(), // convert Date → string
  }));

  // Format other user data
  const otherUserData = {
    id: otherUser.user.id,
    name: otherUser.user.name,
    username:
      otherUser.profile?.username || otherUser.user.email.split("@")[0],
    avatarUrl:
      otherUser.profile?.avatarUrl || otherUser.user.image || null,
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to messages
          </Link>
        </div>

        {/* Chat window */}
        <div className="flex-1 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 mx-4 mb-4 overflow-hidden">
          <ChatWindow
            otherUser={otherUserData}
            initialMessages={formattedMessages}
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  // ✅ unwrap params
  const { userId } = await params;

  const [otherUser] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    title: otherUser
      ? `Chat with ${otherUser.name} - FanVault`
      : "Chat - FanVault",
  };
}