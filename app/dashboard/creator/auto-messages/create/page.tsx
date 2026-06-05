// app/dashboard/creator/auto-messages/create/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CreateAutoMessageForm } from "@/components/creator/CreateAutoMessageForm";

export default async function CreateAutoMessagePage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Create Auto Message
          </h1>
          <p className="text-gray-400">
            Set up automated messages for your subscribers
          </p>
        </div>

        <CreateAutoMessageForm creatorId={creator.id} />
      </div>
    </div>
  );
}