// app/[username]/page.tsx
// Public creator profile page - Next.js 15 compatible

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ProfilePage } from "@/components/profile-page";
import { getProfileByUsername } from "@/actions/profile-actions";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  // In Next.js 15, params IS a Promise and must be awaited
  const { username } = await params;
  
  console.log('[Profile] Loading profile for:', username);
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const result = await getProfileByUsername(username);

  if (!result.success || !result.data) {
    console.log('[Profile] Profile not found for:', username);
    notFound();
  }

  const { profile, creatorAccount } = result.data;

  // Check if this is the user's own profile
  const isOwnProfile = session?.user?.id === profile.id;

  // TODO: Check if current user is subscribed to this creator
  const isSubscribed = false;

  return (
    <ProfilePage
      profile={profile}
      creatorAccount={creatorAccount}
      isOwnProfile={isOwnProfile}
      isSubscribed={isSubscribed}
    />
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: ProfilePageProps) {
  // MUST await params in Next.js 15
  const { username } = await params;
  
  console.log('[Metadata] Generating metadata for:', username);
  
  const result = await getProfileByUsername(username);

  if (!result.success || !result.data) {
    return {
      title: "Profile Not Found",
    };
  }

  const { profile } = result.data;

  return {
    title: `${profile.username} - FanVault`,
    description: profile.username || `Check out ${profile.username}'s profile on FanVault`,
  };
}