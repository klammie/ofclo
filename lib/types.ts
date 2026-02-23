// lib/types.ts
// Shared TypeScript types for the entire application
// All types use BetterAuth's user table structure

import type { InferSelectModel, SQL } from "drizzle-orm";
import type {
  user, creators, agencies, posts, subscriptions, tips,
  transactions, payouts, reports, creatorWallets, profiles,
  messages,
} from "@/db/schema";

// ═══════════════════════════════════════════════════════════════════════════════
// BASE MODEL TYPES (inferred from Drizzle schema)
// ═══════════════════════════════════════════════════════════════════════════════

export type User            = InferSelectModel<typeof user>;
export type Profile         = InferSelectModel<typeof profiles>;
export type Agency          = InferSelectModel<typeof agencies>;
export type Creator         = InferSelectModel<typeof creators>;
export type Post            = InferSelectModel<typeof posts>;
export type Subscription    = InferSelectModel<typeof subscriptions>;
export type Tip             = InferSelectModel<typeof tips>;
export type Transaction     = InferSelectModel<typeof transactions>;
export type Payout          = InferSelectModel<typeof payouts>;
export type Report          = InferSelectModel<typeof reports>;
export type CreatorWallet   = InferSelectModel<typeof creatorWallets>;
export type Message         = InferSelectModel<typeof messages>;

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD TYPE (used across all dashboards)
// ═══════════════════════════════════════════════════════════════════════════════

export type StatItem = {
  label:  string;
  value:  string;
  change: string;
  up:     boolean;
  icon?:  string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN-SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Creator row as seen by Admin */
export type AdminCreatorRow = {
  id:              string;
  userId:          string;
  status:          Creator["status"];
  isVerified:      boolean;
  subscriberCount: number;
  totalEarnings:   string;
  pendingPayout:   string;
  createdAt:       Date;
  user: {
    name:      string;
    email:     string;
    username:  string;
    avatarUrl: string | null;
    banned:    boolean;
  };
  agency: {
    id:   string;
    name: string;
  } | null;
};

/** Agency row as seen by Admin */
export type AdminAgencyRow = {
  id:             string;
  name:           string;
  description:    string | null;
  commissionRate: string;
  isVerified:     boolean;
  createdAt:      Date;
  user: {
    name:     string;
    email:    string;
    username: string;
  };
  stats: {
    creatorCount:     number;
    totalRevenue:     number;
    commissionEarned: number;
  };
};

/** User row as seen by Admin */
export type AdminUserRow = {
  id:            string;
  name:          string;
  email:         string;
  role:          "user" | "creator" | "agency" | "admin";
  banned:        boolean;
  banReason:     string | null;
  emailVerified: boolean;
  createdAt:     Date;
  username:      string;
  avatarUrl:     string | null;
};

/** Subscription row for admin view */
export type AdminSubscriptionRow = Subscription & {
  user: {
    name:     string;
    email:    string;
    username: string;
  };
  creator: {
    name:     string;
    username: string;
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENCY-SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Creator row as seen by Agency */
export type AgencyCreatorRow = {
  id:               string;
  userId:           string;
  status:           Creator["status"];
  subscriberCount:  number;
  totalEarnings:    string;
  monthlyRevenue:   string;
  growthPercent:    number;
  commissionEarned: string;
  user: {
    name:      string;
    email:     string;
    username:  string;
    avatarUrl: string | null;
  };
};

/** Commission breakdown row */
export type AgencyCommissionRow = {
  creatorId:        string;
  creatorName:      string;
  creatorUsername:  string;
  monthlyRevenue:   string;
  commissionRate:   string;
  commissionEarned: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATOR-SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Post with engagement stats */
export type PostWithStats = Post & {
  unlockCount: number;
  revenue:     number;
};

/** Subscriber with spending details */
export type SubscriberWithDetails = Subscription & {
  user: {
    id:        string;
    name:      string;
    email:     string;
    username:  string;
    avatarUrl: string | null;
  };
  totalSpent: number;
  tipCount:   number;
};

/** Tip with sender info */
export type TipWithSender = Tip & {
  sender: {
    displayName: string;
    avatarUrl:   string | null;
  } | null; // null if anonymous
};

/** Earnings breakdown by source */
export type CreatorEarningsBreakdown = {
  subscriptions: {
    amount:     number;
    percentage: number;
  };
  ppv: {
    amount:     number;
    percentage: number;
  };
  tips: {
    amount:     number;
    percentage: number;
  };
  total: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER/FAN-SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Post with unlock status for a given user */
export type PostWithAccess = Post & {
  isUnlocked: boolean;
  hasLiked:   boolean;
  creator: {
    id:   string;
    user: {
      displayName: string;
      username:    string;
      avatarUrl:   string | null;
    };
  };
};

/** Subscription with creator details */
export type SubscriptionWithCreator = Subscription & {
  creator: {
    id:   string;
    user: {
      displayName: string;
      username:    string;
      avatarUrl:   string | null;
    };
  };
  unreadMessages: number;
};

/** Creator card for discovery */
export type CreatorCardData = {
  id:              string;
  name:            string;
  username:        string;
  avatarUrl:       string | null;
  coverImageUrl:   string | null;
  bio:             string | null;
  isVerified:      boolean;
  subscriberCount: number;
  postCount:       number;
  standardPrice:   number;
  vipPrice:        number;
  previewImage:    string | null;
};

/** Message with sender info */
export type MessageWithSender = Message & {
  sender: {
    id:          string;
    displayName: string;
    username:    string;
    avatarUrl:   string | null;
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Payout with creator + user details for admin display */
export type PayoutWithCreator = Payout & {
  creator: {
    id:   string;
    user: {
      displayName: string;
      username:    string;
    };
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Report with full context for moderation */
export type ReportWithDetails = Report & {
  reportedBy: {
    displayName: string;
    username:    string;
  };
  reportedCreator: {
    id:   string;
    user: {
      displayName: string;
    };
  } | null;
  reportedPost: {
    id:    string;
    title: string;
  } | null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAXELPAY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** MaxelPay checkout response */
export type MaxelPayCheckout = {
  checkoutUrl: string;
  orderId:     string;
};

/** MaxelPay webhook event */
export type MaxelPayWebhook = {
  orderId:    string;
  status:     "completed" | "failed" | "expired" | "pending";
  amount:     string;
  currency:   string; // crypto symbol
  network:    string; // e.g. "ERC20"
  txHash:     string;
  timestamp:  string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORM INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type CreatePostInput = {
  title:        string;
  description?: string;
  contentType:  "image" | "video" | "audio" | "text";
  mediaUrl:     string;
  thumbnailUrl?: string;
  isLocked:     boolean;
  ppvPrice?:    number;
  scheduledAt?: Date;
};

export type UpdateCreatorProfileInput = {
  bio?:             string;
  coverImageUrl?:   string;
  standardPrice?:   number;
  vipPrice?:        number;
};

export type CreateWalletInput = {
  currency:  string;
  network:   string;
  address:   string;
  isDefault: boolean;
};

export type SendTipInput = {
  creatorId:   string;
  amount:      number;
  message?:    string;
  isAnonymous?: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ApiResponse<T = SQL> = 
  | { success: true; data: T }
  | { success: false; error: string };

export type PaginatedResponse<T> = {
  data:       T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string; // always normalized
  image?: string | null;
};
export interface DbUser extends SessionUser {
  role: "admin" | "agency" | "creator" | "user";
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  banned: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
}
