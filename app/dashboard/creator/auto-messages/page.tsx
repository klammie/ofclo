// app/dashboard/creator/auto-messages/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators, autoMessages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AutoMessagesList } from "@/components/creator/AutoMessagesList";
import Link from "next/link";

export default async function AutoMessagesPage() {
  const { user } = await requireRole("creator");

  // Get creator
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // Get auto messages
  const messages = await db
    .select()
    .from(autoMessages)
    .where(eq(autoMessages.creatorId, creator.id))
    .orderBy(desc(autoMessages.createdAt));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              🤖 Auto Messages
            </h1>
            <p className="text-gray-400">
              Send automated messages to subscribers
            </p>
          </div>
          <Link
            href="/dashboard/creator/auto-messages/create"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            + Create Auto Message
          </Link>
        </div>

        <AutoMessagesList messages={messages} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Auto Messages - FanVault Creator",
  description: "Manage automated messages",
};