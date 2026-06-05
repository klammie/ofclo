// app/dashboard/creator/campaigns/create/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";

export default async function CreateCampaignPage() {
  const { user } = await requireRole("creator");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Create Campaign
          </h1>
          <p className="text-gray-400">
            Set a goal and let your fans support you
          </p>
        </div>

        <CreateCampaignForm />
      </div>
    </div>
  );
}