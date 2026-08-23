// lib/types.ts
// Shared TypeScript types for the entire application
// All types use BetterAuth's user table structure

import type { InferSelectModel, SQL } from "drizzle-orm";
import type { ShopItemRarity } from "./shop.service";
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
  onboardingCompleted?: boolean;
}


// lib/types.ts (ADD THESE TO YOUR EXISTING TYPES FILE)

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION TYPES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Subscriber with full details (for creators viewing their subscribers)
 */
export type SubscriberWithDetails = {
  subscriptionId: string;
  userId: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  tier: "standard" | "vip";
  status: string;
  totalSpent: number;
  tipCount: number;
  subscribedAt: Date;
};

/**
 * Subscription with creator details (for users viewing their subscriptions)
 */
export type SubscriptionWithCreator = {
  subscriptionId: string;
  tier: "standard" | "vip";
  status: string;
  price: number;
  nextBillingDate: Date | null;
  subscribedAt: Date;
  creatorUserId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  creatorCoverUrl: string | null;
  unreadMessageCount: number;
};

export type DayState = "claimed" | "today" | "locked";

export interface DayReward {
  daySlot: number;
  label: string;
  icon: string;
  rewardType: string;
  rewardAmount: number;
  rewardLabel: string;
  isSpecialDay: boolean;
  state: DayState;
  isVipOnly: boolean; // gift/badge rewards only claimable by VIP — free users see it greyed out
}

export interface StreakMilestone {
  id: number;
  streakDays: number;
  title: string;
  icon: string;
  rewardLabel: string;
  claimed: boolean;
  daysAway: number;
}

export interface LoginBonusData {
  currentStreak: number;
  longestStreak: number;
  currentDaySlot: number;
  lastClaimedAt: string | null;
  canClaimToday: boolean;
  nextClaimAt: string | null;
  streakFreezes: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
  isVip: boolean;
  vipMultiplier: number;
  todayReward: DayReward;
  weekRewards: DayReward[];
  milestones: StreakMilestone[];
}

export interface ClaimResponse {
  success: boolean;
  rewardType: string;
  rewardAmount: number;
  bonusAmount: number;
  newStreak: number;
  newDaySlot: number;
  milestonesUnlocked: StreakMilestone[];
  totalXpEarned: number;
  message: string;
}

export interface ApiError {
  error: string;
  code: "ALREADY_CLAIMED" | "NO_SEASON" | "UNAUTHORIZED" | "SERVER_ERROR";
}

// ─── Pass Level / XP ─────────────────────────────────────────────────────────
 
export interface PassLevel {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string; // e.g. "Bronze Fan", "Silver Fan"
}
 
// ─── Pass Reward Track ────────────────────────────────────────────────────────
 
export type TrackTier = "free" | "vip";
 
export interface PassReward {
  id: number;
  level: number;
  tier: TrackTier;
  icon: string;
  label: string;
  rewardType: string;
  rewardAmount: number;
  claimed: boolean;
  isVipOnly: boolean;
  isAvailable: boolean; // user has reached this level
}
 
// ─── Leaderboard ──────────────────────────────────────────────────────────────
 
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  totalXp: number;
  currentStreak: number;
  isVip: boolean;
  isCurrentUser: boolean;
}
 
// ─── Active Quest ─────────────────────────────────────────────────────────────
 
export type QuestCategory = "daily" | "weekly" | "season";
export type QuestStatus = "active" | "completed" | "locked";
 
export interface Quest {
  id: string;
  category: QuestCategory;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  progress: number;     // 0–100
  target: number;       // e.g. 5 (like 5 posts)
  current: number;      // e.g. 3 (liked 3 so far)
  status: QuestStatus;
  expiresAt: string | null;
  isVipBonus: boolean;  // true = VIP gets 2x on this quest
}
 
// ─── Dashboard props ──────────────────────────────────────────────────────────
 
export interface InitialPassData {
  currentStreak: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
  longestStreak: number;
  streakFreezes: number;
}
 
export interface DashboardUser {
  id: string;
  name: string;
  image: string | null;
  isVip: boolean;
}
 
// ─── Tab IDs ──────────────────────────────────────────────────────────────────
 
export type FansPassTab = "overview" | "rewards" | "quests" | "leaderboard" | "login-bonus";

export type ShopCategory = "all" | "badges" |"mystery_boxes" | "boosters" | "gifts" | "vip" | "freezes" | "inventory";

export type ShopItemRarity = "common" | "rare" | "epic" | "legendary";

export type ShopItemType =
  | "badge"
  | "booster_xp"
  | "booster_coin"
  | "gift"
  | "vip_pass"
  | "streak_freeze"
  | "mystery_box"
  | "emote";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ShopItemType;
  category: ShopCategory;
  rarity: ShopItemRarity;
  coinPrice: number;         // 0 = free (shouldn't happen), use null for real-money only
  realPrice?: number;        // USD cents — if set, item can only be bought with real money
  isCoinsOnly: boolean;      // can only be bought with coins (not real money)
  isRealMoneyOnly: boolean;  // can only be bought with real money
  isFeatured: boolean;
  isLimitedTime: boolean;
  expiresAt?: string;        // ISO string
  stock?: number;            // undefined = unlimited
  boosterMultiplier?: number;// e.g. 2 for 2× XP
  boosterDurationHours?: number;
  owned?: boolean;           // has the user already bought this
  quantity?: number;         // how many the user owns
}

export interface PurchaseRequest {
  itemId: string;
  currency: "coins" | "real";
}

export interface PurchaseResponse {
  success: boolean;
  item: ShopItem;
  newCoinBalance: number;
  message: string;
}

export interface ShopState {
  userCoins: number;
  items: ShopItem[];
  purchasedIds: Set<string>;
}

export interface ApiPurchaseError {
  error: string;
  code: "INSUFFICIENT_COINS" | "ITEM_NOT_FOUND" | "ALREADY_OWNED" | "OUT_OF_STOCK" | "UNAUTHORIZED" | "SERVER_ERROR";
}

// ─── Balances ─────────────────────────────────────────────────────────────────

export interface WalletBalance {
  usdBalance: number;        // cents — spendable USD balance
  coinsBalance: number;      // fan coins
  pendingBalance: number;    // cents — pending earnings (creators)
  lifetimeDeposited: number; // cents
  lifetimeSpent: number;     // cents
  lifetimeEarned: number;    // cents (creator earnings)
  lifetimeWithdrawn: number; // cents
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType =
  | "deposit"          // user added money via payment gateway
  | "withdrawal"       // user withdrew earnings
  | "subscription"     // user paid for a subscription
  | "tip"              // user tipped a creator
  | "ppv"              // pay-per-view purchase
  | "coin_purchase"    // user bought coins (USD → coins)
  | "coin_spend"       // user spent coins in shop
  | "coin_earn"        // user earned coins (quests, streak etc.)
  | "refund"           // refund issued
  | "creator_earning"  // creator received payment
  | "platform_fee"     // platform fee deducted
  | "crypto_deposit";  // crypto payment received

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";
export type TransactionCurrency = "usd" | "coins" | "crypto";

export interface Transactions {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  currency: TransactionCurrency;
  amountCents: number;       // for USD (cents), for coins use coinsAmount
  coinsAmount: number;       // for coin transactions
  description: string;
  metadata?: Record<string, string>;
  createdAt: string;
  // optional linked entities
  creatorName?: string;
  creatorAvatar?: string;
}

// ─── Coin packages ────────────────────────────────────────────────────────────

export interface CoinPackage {
  id: string;
  coins: number;
  priceCents: number;        // USD price
  bonusCoins: number;        // bonus on top
  totalCoins: number;        // coins + bonus
  isBestValue: boolean;
  isMostPopular: boolean;
  cryptoEnabled: boolean;    // can be bought with crypto
}

// ─── Deposit / Withdraw ───────────────────────────────────────────────────────

export interface DepositRequest {
  amountCents: number;
  method: "card" | "crypto";
  cryptoCurrency?: "BTC" | "ETH" | "USDT" | "USDC" | "LTC";
}

export interface DepositResponse {
  success: boolean;
  transactionId: string;
  // For card: redirect to Maxelpay checkout
  checkoutUrl?: string;
  // For crypto: wallet address + amount
  cryptoAddress?: string;
  cryptoAmount?: string;
  cryptoCurrency?: string;
  expiresAt?: string;        // crypto invoice expiry
  qrCodeUrl?: string;
}

export interface WithdrawRequest {
  amountCents: number;
  method: "bank" | "crypto";
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    accountName: string;
  };
  cryptoAddress?: string;
  cryptoCurrency?: string;
}

export interface WithdrawResponse {
  success: boolean;
  transactionId: string;
  estimatedArrival: string;
  message: string;
}

// ─── Coin purchase ────────────────────────────────────────────────────────────

export interface BuyCoinsRequest {
  packageId: string;
  method: "usd_balance" | "card" | "crypto";
  cryptoCurrency?: string;
}

export interface BuyCoinsResponse {
  success: boolean;
  coinsAdded: number;
  newCoinBalance: number;
  newUsdBalance: number;
  transactionId: string;
  // If paying by card/crypto, redirect or crypto invoice
  checkoutUrl?: string;
  cryptoAddress?: string;
  cryptoAmount?: string;
  cryptoCurrency?: string;
  expiresAt?: string;
}

// ─── API error ────────────────────────────────────────────────────────────────

export interface WalletApiError {
  error: string;
  code: "INSUFFICIENT_FUNDS" | "INVALID_AMOUNT" | "UNAUTHORIZED" | "SERVER_ERROR" | "BELOW_MINIMUM";
}

export type NotificationType =
  | "new_subscriber"       // someone subscribed to you (creator)
  | "new_message"          // new DM received
  | "new_tip"              // someone tipped you
  | "new_like"             // someone liked your post
  | "new_comment"          // someone commented on your post
  | "subscription_expiring"// your subscription to a creator is expiring soon
  | "new_post"             // creator you subscribe to posted new content
  | "ppv_purchased"        // someone bought your PPV
  | "campaign_milestone"   // a campaign you joined hit a milestone
  | "campaign_reward"      // you earned a campaign reward
  | "coin_earned"          // you earned coins (quest, streak etc.)
  | "level_up"             // you levelled up in fan pass
  | "streak_reminder"      // you haven't claimed daily bonus yet
  | "streak_broken"        // your streak was broken
  | "shop_purchase"        // shop purchase confirmed
  | "withdrawal_approved"  // withdrawal approved
  | "withdrawal_rejected"  // withdrawal rejected
  | "deposit_confirmed"    // deposit confirmed
  | "system"               // general platform notification
  | "welcome";             // welcome notification

export type NotificationPriority = "low" | "medium" | "high";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon: string;             // emoji
  imageUrl?: string;        // avatar or content thumbnail
  actionUrl?: string;       // where to navigate on click
  isRead: boolean;
  createdAt: string;
  // optional linked entity info
  actorName?: string;       // who triggered it
  actorAvatar?: string;
  entityId?: string;        // post/subscription/etc id
}

export interface NotificationSummary {
  total: number;
  unreadCount: number;
  notifications: Notification[];
}

export interface MarkReadRequest {
  notificationId: string;
}

export interface MarkAllReadResponse {
  success: boolean;
  markedCount: number;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileSettings {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  dateOfBirth: string | null;    // ISO date string
}

// ─── Account ──────────────────────────────────────────────────────────────────

export interface AccountSettings {
  email: string;
  phone: string | null;
  language: string;
  currency: string;
  timezone: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  currentPassword: string;
}

// ─── Privacy ──────────────────────────────────────────────────────────────────

export type ProfileVisibility = "public" | "followers" | "private";
export type MessagePermission  = "everyone" | "subscribers" | "nobody";
export type ActivityVisibility = "public" | "private";

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  showActivityStatus: boolean;
  showSubscriptions: boolean;
  allowTagging: boolean;
  messagePermission: MessagePermission;
  allowComments: boolean;
  showOnlineStatus: boolean;
  activityVisibility: ActivityVisibility;
  blockedUserCount: number;
  restrictedUserCount: number;
  dataDownloadAvailable: boolean;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  // In-app
  inAppNewSubscriber: boolean;
  inAppNewMessage: boolean;
  inAppNewTip: boolean;
  inAppNewLike: boolean;
  inAppNewComment: boolean;
  inAppNewPost: boolean;
  inAppFanPass: boolean;
  inAppWallet: boolean;
  inAppSystem: boolean;
  // Email
  emailNewSubscriber: boolean;
  emailNewMessage: boolean;
  emailNewTip: boolean;
  emailMarketing: boolean;
  emailWeeklyDigest: boolean;
  emailSecurityAlerts: boolean;
  // Push
  pushEnabled: boolean;
  pushNewMessage: boolean;
  pushNewSubscriber: boolean;
  pushNewTip: boolean;
  pushFanPass: boolean;
}

// ─── Appearance ───────────────────────────────────────────────────────────────

export type ThemeMode    = "dark" | "light" | "system";
export type AccentColor  = "pink" | "purple" | "blue" | "green" | "orange" | "red";
export type FontSize     = "small" | "medium" | "large";
export type ContentLayout = "grid" | "list";

export interface AppearanceSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  fontSize: FontSize;
  contentLayout: ContentLayout;
  reduceMotion: boolean;
  compactMode: boolean;
  showExplicitContent: boolean;   // requires age verification
}

// ─── Security ─────────────────────────────────────────────────────────────────

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: "app" | "sms" | null;
  loginAlerts: boolean;
  activeSessions: ActiveSession[];
  loginHistory: LoginEvent[];
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginEvent {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  success: boolean;
}

// ─── Full settings payload ────────────────────────────────────────────────────

export interface UserSettings {
  profile: ProfileSettings;
  account: AccountSettings;
  privacy: PrivacySettings;
  notifications: NotificationPreferences;
  appearance: AppearanceSettings;
  security: SecuritySettings;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export type SettingsTab = "profile" | "account" | "privacy" | "notifications" | "appearance" | "security";

export interface SaveResult {
  success: boolean;
  message: string;
}

export type IdDocumentType =
  | "passport"
  | "drivers_license"
  | "national_id"
  | "residence_permit";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "more_info_required";

export type ContentCategory =
  | "lifestyle"
  | "fitness"
  | "art"
  | "music"
  | "gaming"
  | "cooking"
  | "fashion"
  | "education"
  | "comedy"
  | "adult"
  | "other";

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

export interface PersonalInfoStep {
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: string;        // YYYY-MM-DD
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

// ─── Step 2: Identity Verification ───────────────────────────────────────────

export interface IdentityStep {
  documentType: IdDocumentType;
  documentNumber: string;
  documentExpiry: string;     // YYYY-MM-DD
  // File references (uploaded to storage, stored as URLs)
  documentFrontUrl: string;
  documentBackUrl: string;    // not required for passport
  selfieWithIdUrl: string;    // selfie holding the ID
  selfieUrl: string;          // clear face photo
}

// ─── Step 3: Creator Profile ──────────────────────────────────────────────────

export interface CreatorProfileStep {
  displayName: string;
  username: string;
  bio: string;
  categories: ContentCategory[];
  socialLinks: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  subscriptionPrice: number;  // cents per month
  hasPreviousExperience: boolean;
  previousPlatforms: string;
  contentDescription: string;
}

// ─── Step 4: Payout Info ──────────────────────────────────────────────────────

export interface PayoutStep {
  payoutMethod: "bank" | "crypto";
  // Bank
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankName?: string;
  bankCountry?: string;
  // Crypto
  cryptoWalletAddress?: string;
  cryptoCurrency?: string;
  // Tax
  taxCountry: string;
  taxId: string;              // SSN / VAT / EIN etc.
  isBusinessAccount: boolean;
  businessName?: string;
}

// ─── Step 5: Agreements ───────────────────────────────────────────────────────

export interface AgreementsStep {
  agreedToTerms: boolean;
  agreedToContentPolicy: boolean;
  agreedToAge18: boolean;
  agreedToTaxObligations: boolean;
  agreedToPrivacyPolicy: boolean;
  signature: string;          // typed full legal name
}

// ─── Full Application ─────────────────────────────────────────────────────────

export interface CreatorApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  currentStep: number;
  personal: PersonalInfoStep;
  identity: IdentityStep;
  profile: CreatorProfileStep;
  payout: PayoutStep;
  agreements: AgreementsStep;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDraft {
  currentStep: number;
  personal: Partial<PersonalInfoStep>;
  identity: Partial<IdentityStep>;
  profile: Partial<CreatorProfileStep>;
  payout: Partial<PayoutStep>;
  agreements: Partial<AgreementsStep>;
}



// ─── Season ───────────────────────────────────────────────────────────────────

export type SeasonStatus = "draft" | "active" | "ended";

export interface FanPassSeason {
  id: number;
  name: string;
  description: string;
  status: SeasonStatus;
  startDate: string;
  endDate: string;
  vipPriceCents: number;       // price of VIP pass in cents
  vipPriceCoins: number;       // price in coins (0 = not available for coins)
  maxLevel: number;
  xpPerLevel: number;          // flat XP needed per level (or use curve)
  creatorId: string | null;    // null = platform-wide season
  agencyId: string | null;
  totalParticipants: number;
  totalVipSubscribers: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  vipPriceCents: number;
  vipPriceCoins: number;
  maxLevel: number;
}

// ─── Pass Reward (reward track) ───────────────────────────────────────────────

export type RewardTrackTier = "free" | "vip";

export interface PassRewardItem {
  id: number;
  seasonId: number;
  level: number;
  tier: RewardTrackTier;
  icon: string;
  label: string;
  rewardType: string;
  rewardAmount: number;
  isVipOnly: boolean;
  description: string;
  rarity: ShopItemRarity;
  createdAt: string;
  updatedAt: string;
}

export interface RewardFormData {
  level: number;
  tier: RewardTrackTier;
  icon: string;
  label: string;
  rewardType: string;
  rewardAmount: number;
  isVipOnly: boolean;
  description: string;
  rarity: ShopItemRarity;
}

// ─── Day Config ───────────────────────────────────────────────────────────────

export interface DayConfigItem {
  id: number;
  seasonId: number;
  daySlot: number;
  label: string;
  icon: string;
  rewardType: string;
  rewardAmount: number;
  rewardLabel: string;
  isSpecialDay: boolean;
}

// ─── Milestone ────────────────────────────────────────────────────────────────

export interface MilestoneItem {
  id: number;
  seasonId: number;
  streakDays: number;
  title: string;
  icon: string;
  rewardType: string;
  rewardAmount: number;
  rewardLabel: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface SeasonAnalytics {
  seasonId: number;
  totalParticipants: number;
  totalVip: number;
  vipConversionRate: number;
  avgLevel: number;
  avgStreak: number;
  totalXpDistributed: number;
  totalCoinsDistributed: number;
  dailyClaimRate: number;       // % of users who claim daily bonus
  topLevel: number;
  levelDistribution: { level: number; count: number }[];
  streakDistribution: { streakDays: number; count: number }[];
  revenueEstimateCents: number;
}

// ─── Agency context ───────────────────────────────────────────────────────────

export interface AgencyFanPassContext {
  agencyId: string;
  agencyName: string;
  canManageSeasons: boolean;
  canManageRewards: boolean;
  canViewAnalytics: boolean;
  canManageShop: boolean;
}

// ─── Rarity tiers ─────────────────────────────────────────────────────────────

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_RATES: Record<Rarity, number> = {
  common:    0.60,   // 60%
  rare:      0.26,   // 26%
  epic:      0.12,   // 12%
  legendary: 0.02,   //  2%
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    "#94a3b8",
  rare:      "#38bdf8",
  epic:      "#a78bfa",
  legendary: "#fbbf24",
};

export const RARITY_GLOWS: Record<Rarity, string> = {
  common:    "rgba(148,163,184,0.2)",
  rare:      "rgba(56,189,248,0.3)",
  epic:      "rgba(167,139,250,0.4)",
  legendary: "rgba(251,191,36,0.5)",
};

// ─── Box types ────────────────────────────────────────────────────────────────

export type MysteryBoxType = "creator" | "gifts_badges" | "boosters";

export interface MysteryBoxDefinition {
  id:          MysteryBoxType;
  name:        string;
  description: string;
  icon:        string;
  coinPrice:   number;
  gradient:    string;
  glowColor:   string;
  contents:    string; // Short teaser of what's inside
}

export const MYSTERY_BOXES: MysteryBoxDefinition[] = [
  {
    id:          "creator",
    name:        "Creator Box",
    description: "Exclusive creator-themed rewards. Profile frames, creator badges, custom emotes and special fan titles.",
    icon:        "🎬",
    coinPrice:   1500,
    gradient:    "linear-gradient(135deg, #7c3aed 0%, #ef3976 100%)",
    glowColor:   "rgba(124,58,237,0.5)",
    contents:    "Creator badges · Profile frames · Fan titles · Emotes",
  },
  {
    id:          "gifts_badges",
    name:        "Gift & Badge Box",
    description: "Send gifts to your favourite creators or unlock exclusive badges to show off on your profile.",
    icon:        "🎁",
    coinPrice:   1200,
    gradient:    "linear-gradient(135deg, #f59e0b 0%, #ef3976 100%)",
    glowColor:   "rgba(245,158,11,0.5)",
    contents:    "Creator gifts · Profile badges · Fan coins · Special stickers",
  },
  {
    id:          "boosters",
    name:        "Power Box",
    description: "Boost your XP, freeze your streaks, and accelerate your Fan Pass progression.",
    icon:        "⚡",
    coinPrice:   1000,
    gradient:    "linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)",
    glowColor:   "rgba(6,182,212,0.5)",
    contents:    "XP Boosters · Streak Freezes · Coin Boosters · Mega Boosts",
  },
];

// ─── Reward item ──────────────────────────────────────────────────────────────

export interface RewardItem {
  id:          string;
  name:        string;
  description: string;
  icon:        string;
  rarity:      Rarity;
  type:        string;   // maps to shopItemTypeEnum
  // What the user actually receives:
  rewardType:  "coins" | "xp" | "badge" | "emote" | "title" | "frame" | "gift" | "booster_xp" | "booster_coin" | "streak_freeze" | "mystery_box";
  rewardAmount?: number; // for coins/xp
  boosterMultiplier?: number;
  boosterDurationHours?: number;
}

// ─── Reward pools per box type ────────────────────────────────────────────────
// Drop rates per rarity:
//   common    = 60%  (items in this array share equal probability within the tier)
//   rare      = 26%
//   epic      = 12%
//   legendary =  2%

export const REWARD_POOLS: Record<MysteryBoxType, Record<Rarity, RewardItem[]>> = {

  // ══════════════════════════════════════════════════════════════════════════
  // CREATOR BOX
  // ══════════════════════════════════════════════════════════════════════════

  creator: {
    common: [
      { id: "creator_emote_wave",     name: "Wave Emote",          description: "A friendly wave emote for your chats.",          icon: "👋", rarity: "common",    type: "emote",  rewardType: "emote"  },
      { id: "creator_emote_heart",    name: "Heart Emote",         description: "Show your love with this heart emote.",          icon: "❤️", rarity: "common",    type: "emote",  rewardType: "emote"  },
      { id: "creator_emote_fire",     name: "Fire Emote",          description: "Bring the heat to any conversation.",           icon: "🔥", rarity: "common",    type: "emote",  rewardType: "emote"  },
      { id: "creator_emote_star",     name: "Star Emote",          description: "You're a star and everyone knows it.",          icon: "⭐", rarity: "common",    type: "emote",  rewardType: "emote"  },
      { id: "creator_badge_fan",      name: "Fan Badge",           description: "A simple badge showing you're a true fan.",     icon: "🏅", rarity: "common",    type: "badge",  rewardType: "badge"  },
      { id: "creator_badge_loyal",    name: "Loyal Fan Badge",     description: "For fans who always show up.",                  icon: "💙", rarity: "common",    type: "badge",  rewardType: "badge"  },
      { id: "creator_coins_50",       name: "50 Coins",            description: "A small coin reward.",                          icon: "🪙", rarity: "common",    type: "coins",  rewardType: "coins",  rewardAmount: 50    },
      { id: "creator_title_fan",      name: "\"True Fan\" Title",  description: "Display this title on your profile.",           icon: "📛", rarity: "common",    type: "badge",  rewardType: "title"  },
    ],
    rare: [
      { id: "creator_frame_purple",   name: "Purple Frame",        description: "A sleek purple avatar frame.",                  icon: "🟣", rarity: "rare",      type: "badge",  rewardType: "frame"  },
      { id: "creator_frame_pink",     name: "Pink Frame",          description: "A vibrant pink avatar frame.",                  icon: "🩷", rarity: "rare",      type: "badge",  rewardType: "frame"  },
      { id: "creator_emote_crown",    name: "Crown Emote",         description: "Royalty-level emote for your chats.",           icon: "👑", rarity: "rare",      type: "emote",  rewardType: "emote"  },
      { id: "creator_emote_clap",     name: "Standing Ovation",    description: "Clap it out for your favourite creator.",       icon: "👏", rarity: "rare",      type: "emote",  rewardType: "emote"  },
      { id: "creator_badge_supporter",name: "Supporter Badge",     description: "Show creators you have their back.",            icon: "🎖️", rarity: "rare",     type: "badge",  rewardType: "badge"  },
      { id: "creator_title_superfan", name: "\"Super Fan\" Title", description: "An upgraded fan title for your profile.",       icon: "📛", rarity: "rare",      type: "badge",  rewardType: "title"  },
      { id: "creator_coins_150",      name: "150 Coins",           description: "A solid coin reward.",                          icon: "🪙", rarity: "rare",      type: "coins",  rewardType: "coins",  rewardAmount: 150   },
    ],
    epic: [
      { id: "creator_frame_gold",     name: "Gold Animated Frame", description: "An animated gold avatar frame.",                icon: "✨", rarity: "epic",      type: "badge",  rewardType: "frame"  },
      { id: "creator_frame_galaxy",   name: "Galaxy Frame",        description: "A galaxy-themed animated frame.",               icon: "🌌", rarity: "epic",      type: "badge",  rewardType: "frame"  },
      { id: "creator_emote_legend",   name: "Legend Emote Pack",   description: "A pack of 5 exclusive legend-tier emotes.",     icon: "🏆", rarity: "epic",      type: "emote",  rewardType: "emote"  },
      { id: "creator_badge_elite",    name: "Elite Fan Badge",     description: "Only the most dedicated fans earn this.",       icon: "💎", rarity: "epic",      type: "badge",  rewardType: "badge"  },
      { id: "creator_title_elite",    name: "\"Elite Fan\" Title", description: "A rare title reserved for top fans.",           icon: "📛", rarity: "epic",      type: "badge",  rewardType: "title"  },
      { id: "creator_coins_400",      name: "400 Coins",           description: "A generous coin reward.",                       icon: "🪙", rarity: "epic",      type: "coins",  rewardType: "coins",  rewardAmount: 400   },
    ],
    legendary: [
      { id: "creator_frame_divine",   name: "Divine Frame",        description: "An ultra-rare animated divine avatar frame.",   icon: "🌟", rarity: "legendary", type: "badge",  rewardType: "frame"  },
      { id: "creator_badge_goat",     name: "GOAT Badge",          description: "Greatest Of All Time fan badge.",               icon: "🐐", rarity: "legendary", type: "badge",  rewardType: "badge"  },
      { id: "creator_title_goat",     name: "\"GOAT\" Title",      description: "The most prestigious fan title on Fanzluv.",    icon: "📛", rarity: "legendary", type: "badge",  rewardType: "title"  },
      { id: "creator_coins_1000",     name: "1,000 Coins",         description: "A legendary coin windfall.",                    icon: "💰", rarity: "legendary", type: "coins",  rewardType: "coins",  rewardAmount: 1000  },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GIFTS & BADGES BOX
  // ══════════════════════════════════════════════════════════════════════════

  gifts_badges: {
    common: [
      { id: "gift_rose",              name: "Rose Gift",           description: "Send a rose to a creator you love.",            icon: "🌹", rarity: "common",    type: "gift",   rewardType: "gift"   },
      { id: "gift_coffee",            name: "Coffee Gift",         description: "Buy your favourite creator a coffee.",          icon: "☕", rarity: "common",    type: "gift",   rewardType: "gift"   },
      { id: "gift_cookie",            name: "Cookie Gift",         description: "Sweet treat for a sweet creator.",              icon: "🍪", rarity: "common",    type: "gift",   rewardType: "gift"   },
      { id: "gift_balloon",           name: "Balloon Gift",        description: "A cheerful balloon bouquet.",                   icon: "🎈", rarity: "common",    type: "gift",   rewardType: "gift"   },
      { id: "badge_newcomer",         name: "Newcomer Badge",      description: "Welcome to the community!",                     icon: "🆕", rarity: "common",    type: "badge",  rewardType: "badge"  },
      { id: "badge_active",           name: "Active Member Badge", description: "For staying active on the platform.",           icon: "✅", rarity: "common",    type: "badge",  rewardType: "badge"  },
      { id: "gift_coins_75",          name: "75 Coins",            description: "A small coin reward.",                          icon: "🪙", rarity: "common",    type: "coins",  rewardType: "coins",  rewardAmount: 75    },
      { id: "gift_sticker_love",      name: "Love Sticker",        description: "A cute love sticker for messages.",             icon: "💌", rarity: "common",    type: "gift",   rewardType: "gift"   },
    ],
    rare: [
      { id: "gift_bouquet",           name: "Flower Bouquet",      description: "A beautiful bouquet of flowers.",               icon: "💐", rarity: "rare",      type: "gift",   rewardType: "gift"   },
      { id: "gift_cake",              name: "Birthday Cake",        description: "Celebrate your favourite creator.",             icon: "🎂", rarity: "rare",      type: "gift",   rewardType: "gift"   },
      { id: "gift_diamond",           name: "Diamond Gift",         description: "A sparkling diamond gift.",                    icon: "💎", rarity: "rare",      type: "gift",   rewardType: "gift"   },
      { id: "badge_devoted",          name: "Devoted Fan Badge",   description: "For fans who never miss a post.",              icon: "🎯", rarity: "rare",      type: "badge",  rewardType: "badge"  },
      { id: "badge_trendsetter",      name: "Trendsetter Badge",   description: "You were here before it was cool.",             icon: "🚀", rarity: "rare",      type: "badge",  rewardType: "badge"  },
      { id: "gift_coins_200",         name: "200 Coins",            description: "A solid coin reward.",                         icon: "🪙", rarity: "rare",      type: "coins",  rewardType: "coins",  rewardAmount: 200   },
      { id: "gift_sticker_vip",       name: "VIP Sticker Pack",    description: "Exclusive VIP stickers for your messages.",    icon: "⭐", rarity: "rare",      type: "gift",   rewardType: "gift"   },
    ],
    epic: [
      { id: "gift_crown",             name: "Crown Gift",          description: "Crown your favourite creator like royalty.",   icon: "👑", rarity: "epic",      type: "gift",   rewardType: "gift"   },
      { id: "gift_rocket",            name: "Rocket Launch Gift",  description: "Launch your creator to the moon!",             icon: "🚀", rarity: "epic",      type: "gift",   rewardType: "gift"   },
      { id: "gift_trophy",            name: "Trophy Gift",         description: "Award a creator for their amazing work.",      icon: "🏆", rarity: "epic",      type: "gift",   rewardType: "gift"   },
      { id: "badge_legend",           name: "Legend Badge",        description: "A truly legendary fan badge.",                  icon: "🌟", rarity: "epic",      type: "badge",  rewardType: "badge"  },
      { id: "badge_pioneer",          name: "Pioneer Badge",       description: "You helped shape this community.",              icon: "🔭", rarity: "epic",      type: "badge",  rewardType: "badge"  },
      { id: "gift_coins_500",         name: "500 Coins",           description: "An epic coin reward.",                          icon: "🪙", rarity: "epic",      type: "coins",  rewardType: "coins",  rewardAmount: 500   },
    ],
    legendary: [
      { id: "gift_dragon",            name: "Dragon Gift",         description: "The rarest gift on the platform. Ultra prestigious.", icon: "🐉", rarity: "legendary", type: "gift", rewardType: "gift" },
      { id: "gift_galaxy",            name: "Galaxy Gift",         description: "An out-of-this-world gift for top creators.",   icon: "🌌", rarity: "legendary", type: "gift",   rewardType: "gift"   },
      { id: "badge_founder",          name: "Founder Badge",       description: "Extremely rare. Reserved for platform legends.", icon: "🏛️", rarity: "legendary", type: "badge",  rewardType: "badge"  },
      { id: "gift_coins_1200",        name: "1,200 Coins",         description: "A legendary coin jackpot.",                     icon: "💰", rarity: "legendary", type: "coins",  rewardType: "coins",  rewardAmount: 1200  },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BOOSTERS BOX
  // ══════════════════════════════════════════════════════════════════════════

  boosters: {
    common: [
      { id: "boost_xp_1h_1x",         name: "1h XP Boost (1×)",    description: "Double your XP for 1 hour.",                   icon: "⚡", rarity: "common",    type: "booster_xp",    rewardType: "booster_xp",    boosterMultiplier: 2, boosterDurationHours: 1  },
      { id: "boost_coin_1h_1x",        name: "1h Coin Boost (1×)",  description: "Double coin drops for 1 hour.",                icon: "🪙", rarity: "common",    type: "booster_coin",  rewardType: "booster_coin",  boosterMultiplier: 2, boosterDurationHours: 1  },
      { id: "streak_freeze_1",         name: "Streak Freeze",        description: "Protect your streak for 1 day.",               icon: "🧊", rarity: "common",    type: "streak_freeze", rewardType: "streak_freeze", rewardAmount: 1      },
      { id: "boost_coins_50",          name: "50 Bonus Coins",       description: "Instant coin top-up.",                          icon: "💫", rarity: "common",    type: "coins",         rewardType: "coins",         rewardAmount: 50     },
      { id: "boost_xp_30m_1x",         name: "30m XP Boost",         description: "Quick XP double for 30 minutes.",               icon: "⚡", rarity: "common",    type: "booster_xp",    rewardType: "booster_xp",    boosterMultiplier: 2, boosterDurationHours: 0.5 },
    ],
    rare: [
      { id: "boost_xp_3h_2x",          name: "3h XP Boost (2×)",    description: "Triple your XP for 3 hours.",                   icon: "⚡", rarity: "rare",      type: "booster_xp",    rewardType: "booster_xp",    boosterMultiplier: 3, boosterDurationHours: 3  },
      { id: "boost_coin_3h_2x",         name: "3h Coin Boost (2×)",  description: "Triple coin drops for 3 hours.",                icon: "🪙", rarity: "rare",      type: "booster_coin",  rewardType: "booster_coin",  boosterMultiplier: 3, boosterDurationHours: 3  },
      { id: "streak_freeze_3",          name: "3× Streak Freeze",    description: "Protect your streak for 3 days.",               icon: "🧊", rarity: "rare",      type: "streak_freeze", rewardType: "streak_freeze", rewardAmount: 3      },
      { id: "boost_coins_200",          name: "200 Bonus Coins",      description: "A solid instant coin reward.",                  icon: "💫", rarity: "rare",      type: "coins",         rewardType: "coins",         rewardAmount: 200    },
      { id: "boost_xp_6h_1x",           name: "6h XP Boost",          description: "Double XP for a full 6 hours.",                 icon: "⚡", rarity: "rare",      type: "booster_xp",    rewardType: "booster_xp",    boosterMultiplier: 2, boosterDurationHours: 6  },
    ],
    epic: [
      { id: "boost_xp_24h_3x",          name: "24h Mega XP Boost",   description: "4× XP for a full 24 hours.",                   icon: "🔥", rarity: "epic",      type: "booster_xp",    rewardType: "booster_xp",    boosterMultiplier: 4, boosterDurationHours: 24 },
      { id: "boost_coin_24h_3x",         name: "24h Mega Coin Boost", description: "4× coin drops for a full 24 hours.",           icon: "💰", rarity: "epic",      type: "booster_coin",  rewardType: "booster_coin",  boosterMultiplier: 4, boosterDurationHours: 24 },
      { id: "streak_freeze_7",           name: "Week Streak Shield",  description: "Protect your streak for 7 days.",               icon: "🛡️", rarity: "epic",     type: "streak_freeze", rewardType: "streak_freeze", rewardAmount: 7      },
      { id: "boost_coins_500",           name: "500 Bonus Coins",     description: "An epic instant coin reward.",                  icon: "💫", rarity: "epic",      type: "coins",         rewardType: "coins",         rewardAmount: 500    },
      { id: "boost_xp_48h_2x",           name: "48h XP Blitz",         description: "Triple XP for 48 hours straight.",              icon: "⚡", rarity: "epic",      type: "booster_xp",    rewardType: "booster_xp",    boosterMultiplier: 3, boosterDurationHours: 48 },
    ],
    legendary: [
      { id: "boost_mega_week",           name: "Week Mega Bundle",    description: "5× XP + 5× Coins for a full 7 days.",          icon: "💎", rarity: "legendary", type: "booster_xp",    rewardType: "booster_xp",    boosterMultiplier: 5, boosterDurationHours: 168 },
      { id: "boost_streak_freeze_30",    name: "Month Streak Shield", description: "Full month of streak protection.",              icon: "🛡️", rarity: "legendary", type: "streak_freeze", rewardType: "streak_freeze", rewardAmount: 30     },
      { id: "boost_coins_1500",          name: "1,500 Bonus Coins",   description: "A legendary coin windfall.",                    icon: "💰", rarity: "legendary", type: "coins",         rewardType: "coins",         rewardAmount: 1500   },
      { id: "boost_mystery_box_x2",      name: "2 Mystery Boxes",     description: "Two free mystery boxes of your choice.",        icon: "🎁", rarity: "legendary", type: "mystery_box",   rewardType: "mystery_box",   rewardAmount: 2      },
    ],
  },
};

// ─── Season ───────────────────────────────────────────────────────────────────


export interface FanPassSeason {
  id: number;
  name: string;
  description: string;
  status: SeasonStatus;
  startDate: string;
  endDate: string;
  vipPriceCents: number;
  vipPriceCoins: number;
  maxLevel: number;
  xpPerLevel: number;
  totalParticipants: number;
  createdAt: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskType = "weekly" | "streak";
export type PassTier = "free" | "premium"; // premium includes free tasks too

export interface SeasonTask {
  id: number;
  seasonId: number;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  tier: PassTier;      // "free" | "premium"
  type: TaskType;      // "weekly" (randomized) | "streak" (always shown)
  isActive: boolean;
  sortOrder: number;
}

// The 3-task weekly bundle shown to a user:
//   [0] randomly selected free task
//   [1] randomly selected free/premium task
//   [2] always = 7-day login streak
export interface WeeklyTaskBundle {
  tasks: AssignedTask[];
  weekStartDate: string;
  weekEndDate: string;
}

export interface AssignedTask {
  id: number;
  taskId: number;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  tier: PassTier;
  type: TaskType;
  isCompleted: boolean;
  completedAt: string | null;
  isDefault: boolean;        // true = streak task (always shown, not random)
  progress: number;          // 0–100
  progressLabel: string;     // e.g. "3/7 days"
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export type RewardItemType =
  | "coins" | "xp" | "badge" | "booster_xp" | "booster_coin"
  | "streak_freeze" | "mystery_box" | "exclusive_content" | "emote" | "vip_pass";

export type RewardTier = "free" | "vip";

export interface SeasonReward {
  id: number;
  seasonId: number;
  level: number;
  tier: RewardTier;
  icon: string;
  label: string;
  description: string;
  rewardType: RewardItemType;
  rewardAmount: number;
  isVipOnly: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
  sortOrder: number;
}

// Windowed reward track — only 5 milestones shown at once:
// [userLevel-2, userLevel-1, userLevel (current), userLevel+1, userLevel+2]
export interface RewardWindow {
  rewards: WindowedReward[];
  userLevel: number;
  userXp: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export interface WindowedReward {
  reward: SeasonReward;
  state: "past" | "current" | "upcoming";
  isClaimed: boolean;
}

// ─── User progress ────────────────────────────────────────────────────────────

export interface UserSeasonProgress {
  userId: string;
  seasonId: number;
  level: number;
  totalXp: number;
  isVip: boolean;
  loginStreak: number;
  lastClaimedAt: string | null;
}

// ─── Agency reward builder ────────────────────────────────────────────────────

export interface RewardBuilderItem {
  level: number;
  tier: RewardTier;
  rewardType: RewardItemType;
  icon: string;
  label: string;
  description: string;
  rewardAmount: number;
  isVipOnly: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}