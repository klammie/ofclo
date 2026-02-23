"use client";

import { profiles, creatorAccounts } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InferSelectModel } from "drizzle-orm";
import {
  MapPin,
  Link as LinkIcon,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  CheckCircle,
  Users,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Profile = InferSelectModel<typeof profiles>;
type CreatorAccount = InferSelectModel<typeof creatorAccounts>;



interface ProfilePageProps {
  profile: Profile;
  creatorAccount: CreatorAccount | null;
  isOwnProfile: boolean;
  isSubscribed?: boolean;
}

export function ProfilePage({
  profile,
  creatorAccount,
  isOwnProfile,
  isSubscribed = false,
}: ProfilePageProps) {
  const isCreator = creatorAccount?.status === "approved";
  const subscriptionPrice = creatorAccount?.subscriptionPrice
    ? (parseInt(creatorAccount.subscriptionPrice) / 100).toFixed(2)
    : null;

  const socialLinks = profile.socialLinks as {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  } | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-linear-to-r from-pink-500 to-purple-500">
        {profile.bannerUrl && (
          <Image
            src={profile.bannerUrl}
            alt="Profile banner"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-3xl">
                {profile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Name and username */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                {isCreator && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Button variant="outline" asChild>
                    <Link href="/profile/edit">Edit Profile</Link>                
                </Button>
              ) : (
                <>
                  {isCreator && !isSubscribed && (
                    <Button size="lg">
                      Subscribe for ${subscriptionPrice}/month
                    </Button>
                  )}
                  {isSubscribed && (
                    <Button variant="outline" size="lg">
                      Subscribed
                    </Button>
                  )}
                  {creatorAccount?.allowMessages && (
                    <Button variant="outline" size="icon">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          {isCreator && (
            <div className="flex gap-6 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {creatorAccount?.subscriberCount || "0"}
                </span>
                <span className="text-muted-foreground">subscribers</span>
              </div>
              {isOwnProfile && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    ${(parseInt(creatorAccount?.totalEarnings || "0") / 100).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">earned</span>
                </div>
              )}
            </div>
          )}

          {/* Bio and info */}
          <div className="mt-4 space-y-3">
            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span>{new URL(profile.website).hostname}</span>
                </a>
              )}
            </div>

            {/* Social links */}
            {socialLinks && Object.values(socialLinks).some(Boolean) && (
              <div className="flex gap-3">
                {socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${socialLinks.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={`https://instagram.com/${socialLinks.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={`https://youtube.com/${socialLinks.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content tabs */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-12">
                  {isCreator ? (
                    <>
                      <p>No posts yet</p>
                      {isOwnProfile && (
                        <Button className="mt-4" asChild>
                            <Link href="/create">Create your first post</Link>                          
                        </Button>
                      )}
                    </>
                  ) : (
                    <p>This user hasn&apos;t posted anything yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-12">
                  <p>No media yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="analytics" className="mt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {creatorAccount?.subscriberCount || "0"}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Subscribers
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      ${(parseInt(creatorAccount?.totalEarnings || "0") / 100).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Earnings
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-muted-foreground">
                      Total Posts
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
