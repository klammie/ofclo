// app/dashboard/creator/upload/page.tsx
// Test page for media upload functionality

import { requireRole } from "@/lib/auth/guard";
import { UploadTestPage } from "@/components/creator/UploadPage";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CreatorUploadPage() {
  const { user } = await requireRole("creator");

  // Get creator record
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Creator Profile Not Found
          </h1>
          <p className="text-gray-400">
            Please complete your creator onboarding first.
          </p>
        </div>
      </div>
    );
  }

  return <UploadTestPage creatorId={creator.id} />;
}

export const metadata = {
  title: "Upload Media - FanVault",
  description: "Test media upload functionality",
};