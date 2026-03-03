// app/dashboard/creator/messages/[userId]/page.tsx
// Creator chat with individual subscriber

import { requireRole } from "@/lib/auth/guard";
import { getMessageHistory, canUserMessage } from "@/lib/queries/message";
import { db } from "@/db";
import { user, profiles, creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CreatorChatPage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await requireRole("creator");
  const otherUserId = params.userId;

  // Verify creator profile exists
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, session.user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // Get subscriber details
  const [subscriber] = await db
    .select({
      user: user,
      profile: profiles,
    })
    .from(user)
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(user.id, otherUserId))
    .limit(1);

  if (!subscriber) {
    redirect("/dashboard/creator/messages");
  }

  // Get message history
  const messageHistory = await getMessageHistory(session.user.id, otherUserId, 50);

// Normalize createdAt to string
const formattedMessages = messageHistory.map(m => ({
  ...m,
  createdAt: m.createdAt.toISOString(), // convert Date → string
}));


  // Format subscriber data
  const subscriberData = {
    id: subscriber.user.id,
    name: subscriber.user.name,
    username: subscriber.profile?.username || subscriber.user.email.split('@')[0],
    avatarUrl: subscriber.profile?.avatarUrl || subscriber.user.image || null,
  };

  return (
    <div className="h-screen bg-linear-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Back button */}
        <div className="p-4">
          <Link
            href="/dashboard/creator/messages"
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
    otherUser={subscriberData}
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
  params: { userId: string };
}) {
  const [subscriber] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);

  return {
    title: subscriber ? `Chat with ${subscriber.name} - FanVault Creator` : "Chat - FanVault",
  };
}