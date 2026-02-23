import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { CreatorApplicationForm } from "@/components/creator-application-form";
import { getMyCreatorAccount } from "@/actions/creator-actions";

export default async function ApplyCreatorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if user already has a creator account
  const result = await getMyCreatorAccount();
  
  if (result.success && result.data?.creator) {
    // If they already applied, redirect to status page
    redirect("/creator/status");
  }

  if (!result.success || !result.data?.profile) {
    // If no profile exists, redirect to profile setup
    redirect("/profile/setup");
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Creator</h1>
          <p className="text-muted-foreground">
            Start earning by sharing exclusive content with your subscribers
          </p>
        </div>
        <CreatorApplicationForm />
      </div>
    </div>
  );
}