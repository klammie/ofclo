import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getApplicationStatus } from "@/lib/creator-apply.service";
import CreatorApplicationForm from "@/components/creator-apply/CreatorApplicationForm";

export default async function ApplyCreatorPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  // If already a creator, redirect them away
  if ((session.user as any).role === "creator") {
    redirect("/dashboard/creator/overview");
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      <CreatorApplicationForm />
    </div>
  );
}