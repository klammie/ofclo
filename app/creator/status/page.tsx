"use client";

import { creators, profiles } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { InferSelectModel } from "drizzle-orm";

type Profile = InferSelectModel<typeof profiles>;
type CreatorAccount = InferSelectModel<typeof creators>;

interface CreatorStatusProps {
  profile: Profile;
  creatorAccount: CreatorAccount;
}

export default function CreatorStatus({ profile, creatorAccount }: CreatorStatusProps) {
  const getStatusConfig = () => {
    switch (creatorAccount.status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          title: "Application Under Review",
          description:
            "Your creator application is being reviewed. We'll notify you once a decision has been made.",
          badge: "Pending",
          badgeVariant: "secondary" as const,
        };
      case "active":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          title: "Creator Account Active",
          description:
            "Congratulations! Your creator account has been approved. You can now start creating and sharing content.",
          badge: "Approved",
          badgeVariant: "default" as const,
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          title: "Application Rejected",
          description:
            "Unfortunately, your creator application was not approved at this time.",
          badge: "Rejected",
          badgeVariant: "destructive" as const,
        };
      case "suspended":
        return {
          icon: AlertCircle,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          title: "Account Suspended",
          description:
            "Your creator account has been suspended. Please contact support for more information.",
          badge: "Suspended",
          badgeVariant: "destructive" as const,
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          title: "Unknown Status",
          description: "Please contact support.",
          badge: "Unknown",
          badgeVariant: "secondary" as const,
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const subscriptionPrice = (creatorAccount.standardPrice / 100).toFixed(2);
  const vipPrice = parseFloat(creatorAccount.vipPrice).toFixed(2);
  const totalEarnings = parseFloat(creatorAccount.totalEarnings).toFixed(2);
  const pendingPayout = parseFloat(creatorAccount.pendingPayout).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${config.bgColor}`}>
                <StatusIcon className={`h-6 w-6 ${config.color}`} />
              </div>
              <div>
                <CardTitle>{config.title}</CardTitle>
                <CardDescription className="mt-1">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            <Badge variant={config.badgeVariant}>{config.badge}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Application Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Application Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">
                  {new Date(creatorAccount.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <p className="font-medium">
                  {new Date(creatorAccount.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator Dashboard (only show if approved) */}
      {creatorAccount.status === "active" && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {creatorAccount.subscriberCount}
                </div>
                <p className="text-xs text-muted-foreground">Total active subscribers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalEarnings}</div>
                <p className="text-xs text-muted-foreground">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription Price</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${subscriptionPrice}</div>
                <p className="text-xs text-muted-foreground">Per month</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your creator account and content</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button asChild>
                <Link href="/create">Create New Post</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/creator/settings">Creator Settings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${profile.username}`}>View Public Profile</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/creator/payouts">Manage Payouts</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Payout Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <CardTitle>Payouts</CardTitle>
                  <CardDescription>
                    Pending payout: ${pendingPayout}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </>
      )}
    </div>
  );
}