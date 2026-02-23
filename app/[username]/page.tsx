import { notFound } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { ProfilePage } from "@/components/profile-page";
import { getProfileByUsername } from "@/actions/profile-actions";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const result = await getProfileByUsername(username);

  if (!result.success || !result.data) {
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
  const { username } = await params;
  const result = await getProfileByUsername(username);

  if (!result.success || !result.data) {
    return {
      title: "Profile Not Found",
    };
  }

  const { profile } = result.data;

  return {
    title: `${profile.username} (@${profile.username})`,
    description: profile.avatarUrl || `Check out ${profile.username}'s profile`,
  };
}