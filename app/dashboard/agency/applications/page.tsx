// app/dashboard/agency/applications/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creatorApplication, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ApplicationsList } from "@/components/agency/ApplicationsList";

export default async function ApplicationsPage() {
  await requireRole("agency");

  // Get all pending applications
  const applications = await db.execute<{
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    display_name: string;
    bio: string;
    why: string;
    social_links: string | null;
    content_type: string;
    expected_revenue: string | null;
    status: string;
    created_at: Date;
  }>(sql`
    SELECT 
      ca.id,
      ca.user_id,
      u.name as user_name,
      u.email as user_email,
      ca.display_name,
      ca.bio,
      ca.why,
      ca.social_links,
      ca.content_type,
      ca.expected_revenue,
      ca.status,
      ca.created_at
    FROM ${creatorApplication} ca
    JOIN ${user} u ON ca.user_id = u.id
    ORDER BY 
      CASE ca.status 
        WHEN 'pending' THEN 1 
        WHEN 'approved' THEN 2 
        WHEN 'rejected' THEN 3 
      END,
      ca.created_at DESC
  `);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            📋 Creator Applications
          </h1>
          <p className="text-gray-400">
            Review and approve new creator applications
          </p>
        </div>

        <ApplicationsList applications={applications.rows} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Creator Applications - FanVault Agency",
  description: "Review creator applications",
};