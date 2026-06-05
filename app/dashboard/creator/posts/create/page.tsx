// app/dashboard/creator/posts/create/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CreatePostForm } from "@/components/creator/CreatorPostForm";

export default async function CreatePostPage() {
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
            📸 Create Post
          </h1>
          <p className="text-gray-400">
            Share content with your subscribers
          </p>
        </div>

        <CreatePostForm creatorId={creator.id} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Create Post - FanVault Creator",
  description: "Create a new post",
};