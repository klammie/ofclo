// db/schema.ts
// Add these BetterAuth core tables ALONGSIDE your existing app schema.
// BetterAuth will use these internally. Your app's `users` table stays as-is
// but BetterAuth's `user` table must exist — we map them via userId.
// Easiest pattern: let BetterAuth own `user`, and your `creators/agencies/etc`
// reference BetterAuth's user.id as a foreign key.

import {
  pgTable, pgEnum, text, integer, boolean,
  timestamp, decimal, date, uuid, index, serial, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── BetterAuth core tables (required by drizzle adapter) ─────────────────────
// These are the exact column names BetterAuth expects.
// Do NOT rename them — the adapter maps to these directly.

export const user = pgTable("user", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  email:         text("email").notNull().unique(),
  password: text("password"),
  emailVerified: boolean("email_verified").notNull().default(false),
  image:         text("image"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  // ── BetterAuth admin plugin adds this column ──────────────────────────────
  role:          text("role").default("user"),   // "admin" | "agency" | "creator" | "user"
  banned:        boolean("banned").default(false),
  banReason:     text("ban_reason"),
  banExpires:    timestamp("ban_expires"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id:                  text("id").primaryKey(),
  expiresAt:           timestamp("expires_at").notNull(),
  token:               text("token").notNull().unique(),
  ipAddress:           text("ip_address"),
  userAgent:           text("user_agent"),
  userId:              text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // ── admin plugin: track impersonation ─────────────────────────────────────
  impersonatedBy:      text("impersonated_by"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id:                   text("id").primaryKey(),
  accountId:            text("account_id").notNull(),
  providerId:           text("provider_id").notNull(),
  userId:               text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken:          text("access_token"),
  refreshToken:         text("refresh_token"),
  idToken:              text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt:timestamp("refresh_token_expires_at"),
  scope:                text("scope"),
  password:             text("password"),   // hashed password for email/password auth
  createdAt:            timestamp("created_at").notNull().defaultNow(),
  updatedAt:            timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at").defaultNow(),
  updatedAt:  timestamp("updated_at").defaultNow(),
});

// ── App-level enums ───────────────────────────────────────────────────────────
export const contentTypeEnum      = pgEnum("content_type",      ["image","video","audio","text"]);
export const subTierEnum          = pgEnum("sub_tier",          ["standard","vip"]);
export const subStatusEnum        = pgEnum("sub_status",        ["active","cancelled","expired","paused"]);
export const payoutStatusEnum     = pgEnum("payout_status",     ["pending","processing","sent","failed"]);
export const creatorStatusEnum    = pgEnum("creator_status",    ["pending","active","suspended","banned", "rejected"]);
export const reportStatusEnum     = pgEnum("report_status",     ["pending","under_review","resolved","dismissed"]);
export const reportTypeEnum       = pgEnum("report_type",       ["explicit_content","spam","underage_concern","copyright","harassment","other"]);
export const transactionTypeEnum  = pgEnum("transaction_type",  ["subscription","ppv","tip","payout","refund"]);
export const cryptoPayStatusEnum  = pgEnum("crypto_pay_status", ["initiated","pending","completed","failed","expired"]);

// ── profiles ─────────────────────────────────────────────────────────────────
// Extended profile data that BetterAuth's `user` table doesn't store.
// One-to-one with BetterAuth's user.id.
export const profiles = pgTable("profiles", {
  id:          text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  username:    text("username").notNull().unique(),
  avatarUrl:   text("avatar_url"),
  coverUrl:    text("cover_url"),
  bio:         text("bio"),
  location:    text("location"),
  website:     text("website"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  usernameIdx: uniqueIndex("profiles_username_idx").on(t.username),
}));

// Agency table
export const agencies = pgTable("agencies", {
  id:             uuid("id").defaultRandom().primaryKey(),
  userId:         text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
  name:           text("name").notNull(),
  email:          text("email").notNull(),
  logoUrl:        text("logo_url"),
  description:    text("description"),
  websiteUrl:     text("website_url"),
  totalCreators:  integer("total_creators").notNull().default(0),
  totalRevenue:   decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  userIdx: index("agencies_user_idx").on(t.userId),
}));

// Agency-Creator relationship
export const agencyCreators = pgTable("agency_creators", {
  id:          uuid("id").defaultRandom().primaryKey(),
  agencyId:    uuid("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  creatorId:   uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  addedAt:     timestamp("added_at").notNull().defaultNow(),
  permissions: text("permissions").notNull().default("full"), // 'full', 'view_only', 'limited'
}, t => ({
  agencyIdx:   index("agency_creators_agency_idx").on(t.agencyId),
  creatorIdx:  index("agency_creators_creator_idx").on(t.creatorId),
  uniquePair:  index("agency_creators_unique_idx").on(t.agencyId, t.creatorId),
}));

export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;
export type AgencyCreator = typeof agencyCreators.$inferSelect;

// ── creators ──────────────────────────────────────────────────────────────────
export const creators = pgTable("creators", {
  id:              uuid("id").defaultRandom().primaryKey(),
  userId:          text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  agencyId:        uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  bio:             text("bio"),
  coverImageUrl:   text("cover_image_url"),
  standardPrice: integer("standard_price").notNull().default(999),
  vipPrice:        decimal("vip_price",       { precision: 10, scale: 2 }).notNull().default("24.99"),
  isVerified:      boolean("is_verified").notNull().default(false),
  status:          creatorStatusEnum("status").notNull().default("pending"),
  totalEarnings:   decimal("total_earnings",  { precision: 12, scale: 2 }).notNull().default("0.00"),
  pendingPayout:   decimal("pending_payout",  { precision: 12, scale: 2 }).notNull().default("0.00"),
  subscriberCount: integer("subscriber_count").notNull().default(0),
  postCount:       integer("post_count").notNull().default(0),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  userIdIdx:  uniqueIndex("creators_user_id_idx").on(t.userId),
  agencyIdx:  index("creators_agency_id_idx").on(t.agencyId),
  statusIdx:  index("creators_status_idx").on(t.status),
}));

// ── posts ─────────────────────────────────────────────────────────────────────

export const posts = pgTable("posts", {
  id:           uuid("id").defaultRandom().primaryKey(),
  creatorId:    uuid("creator_id")
                  .notNull()
                  .references(() => creators.id, { onDelete: "cascade" }),

  // Media fields
  title:        text("title"),
  description:  text("description"),
  mediaType:    text("media_type").notNull(), // 'image' | 'video'
  mediaUrl:     text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration:     integer("duration"),          // Video duration in seconds
  mediaCount:   integer("media_count").notNull().default(1),

  // Access control
  isLocked:     boolean("is_locked").notNull().default(false),
  ppvPrice:     decimal("ppv_price", { precision: 10, scale: 2 }),

  // Scheduling
  status:       text("status").notNull().default("published"), // 'draft' | 'scheduled' | 'published'
  scheduledFor: timestamp("scheduled_for"), // When to publish
  publishedAt:  timestamp("published_at"),  // When actually published

  // Engagement metrics
  viewCount:    integer("view_count").notNull().default(0),
  likeCount:    integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  unlockCount:  integer("unlock_count").notNull().default(0),
  revenue:      decimal("revenue", { precision: 10, scale: 2 }).notNull().default("0"),

  // Timestamps
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  creatorIdx:   index("posts_creator_idx").on(t.creatorId),
  createdIdx:   index("posts_created_idx").on(t.createdAt),
  statusIdx:    index("posts_status_idx").on(t.status),
  scheduledIdx: index("posts_scheduled_idx").on(t.scheduledFor),
}));


// ---Post Media---------------------------
export const postMedia = pgTable("post_media", {
  id:           serial("id").primaryKey(),
  postId:       uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  sortOrder:    integer("sort_order").notNull().default(0),
  mediaType:    text("media_type").notNull(),
  mediaUrl:     text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration:     integer("duration"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ── Likes ─────────────────────────────────────────────────────────────

export const likes = pgTable("likes", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  postId:    uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userPostUnique: uniqueIndex("likes_user_post_unique").on(t.userId, t.postId),
  postIdx:        uniqueIndex("likes_post_idx").on(t.postId),
}));


// ── Comments ─────────────────────────────────────────────────────────────


export const comments = pgTable("comments", {
  id:        uuid("id").defaultRandom().primaryKey(),
  postId:    uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  content:   text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  // Remove the unique index on postId
  createdIdx: index("comments_created_idx").on(t.createdAt.desc()),
}));


// ── subscriptions ─────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id:                  uuid("id").defaultRandom().primaryKey(),
  userId:              text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  creatorId:           uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  tier:                subTierEnum("tier").notNull().default("standard"),
  status:              subStatusEnum("status").notNull().default("active"),
  priceAtSubscription: decimal("price_at_subscription", { precision: 10, scale: 2 }).notNull(),
  maxelpayOrderId:     text("maxelpay_order_id"),
  cryptoCurrency:      text("crypto_currency"),
  cryptoNetwork:       text("crypto_network"),
  paymentStatus:       cryptoPayStatusEnum("payment_status").notNull().default("initiated"),
  currentPeriodStart:  timestamp("current_period_start").notNull(),
  currentPeriodEnd:    timestamp("current_period_end").notNull(),
  renewalOrderId:      text("renewal_order_id"),
  cancelledAt:         timestamp("cancelled_at"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  userIdIdx:       index("subs_user_id_idx").on(t.userId),
  creatorIdIdx:    index("subs_creator_id_idx").on(t.creatorId),
  statusIdx:       index("subs_status_idx").on(t.status),
  orderIdIdx:      index("subs_order_id_idx").on(t.maxelpayOrderId),
  uniqueActiveSub: uniqueIndex("subs_unique_active_idx").on(t.userId, t.creatorId),
}));


// Bookmarks Table
export const bookmarks = pgTable("bookmarks", {
  id:         uuid("id").defaultRandom().primaryKey(),
  userId:     text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  postId:     uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
}, t => ({
  userIdx:    index("bookmarks_user_idx").on(t.userId),
  postIdx:    index("bookmarks_post_idx").on(t.postId),
  uniquePair: index("bookmarks_unique_idx").on(t.userId, t.postId),
}));

// Tips Table
export const tips = pgTable("tips", {
  id:          uuid("id").defaultRandom().primaryKey(),
  fromUserId:  text("from_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  toCreatorId: uuid("to_creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  postId:      uuid("post_id").references(() => posts.id, { onDelete: "set null" }), // Optional: tip on specific post
  messageId:   uuid("message_id").references(() => messages.id, { onDelete: "set null" }), // Optional: tip on message
  amount:      decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message:     text("message"), // Optional tip message
  status:      text("status").notNull().default("completed"), // 'pending', 'completed', 'failed'
  createdAt:   timestamp("created_at").notNull().defaultNow(),
}, t => ({
  fromUserIdx:  index("tips_from_user_idx").on(t.fromUserId),
  toCreatorIdx: index("tips_to_creator_idx").on(t.toCreatorId),
  postIdx:      index("tips_post_idx").on(t.postId),
  createdIdx:   index("tips_created_idx").on(t.createdAt),
}));

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type Tip = typeof tips.$inferSelect;
export type NewTip = typeof tips.$inferInsert;

// ── ppv_unlocks ───────────────────────────────────────────────────────────────
export const ppvUnlocks = pgTable("ppv_unlocks", {
  id:              uuid("id").defaultRandom().primaryKey(),
  userId:          text("user_id").notNull().references(() => user.id),
  postId:          uuid("post_id").notNull().references(() => posts.id),
  amountPaid:      decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  maxelpayOrderId: text("maxelpay_order_id").notNull(),
  cryptoCurrency:  text("crypto_currency"),
  paymentStatus:   cryptoPayStatusEnum("payment_status").notNull().default("initiated"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
}, t => ({
  userPostIdx: uniqueIndex("ppv_user_post_idx").on(t.userId, t.postId),
  orderIdx:    index("ppv_order_id_idx").on(t.maxelpayOrderId),
}));

// ── transactions ──────────────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id:          uuid("id").defaultRandom().primaryKey(),
  userId:      text("user_id").notNull().references(() => user.id),
  type:        transactionTypeEnum("type").notNull(),
  amount:      decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  maxelpayRef: text("maxelpay_ref"),
  metadata:    text("metadata"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
}, t => ({
  userIdIdx:    index("txns_user_id_idx").on(t.userId),
  typeIdx:      index("txns_type_idx").on(t.type),
  createdAtIdx: index("txns_created_at_idx").on(t.createdAt),
}));

// ── payouts ───────────────────────────────────────────────────────────────────
export const payouts = pgTable("payouts", {
  id:                 uuid("id").defaultRandom().primaryKey(),
  creatorId:          uuid("creator_id").notNull().references(() => creators.id),
  grossAmount:        decimal("gross_amount", { precision: 12, scale: 2 }).notNull(),
  platformFee:        decimal("platform_fee", { precision: 12, scale: 2 }).notNull(),
  netAmount:          decimal("net_amount",   { precision: 12, scale: 2 }).notNull(),
  status:             payoutStatusEnum("status").notNull().default("pending"),
  cryptoCurrency:     text("crypto_currency").notNull().default("USDT"),
  destinationAddress: text("destination_address").notNull(),
  maxelpayTransferId: text("maxelpay_transfer_id"),
  processedAt:        timestamp("processed_at"),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  creatorIdIdx: index("payouts_creator_id_idx").on(t.creatorId),
  statusIdx:    index("payouts_status_idx").on(t.status),
}));

export const maxelpaySessions = pgTable("maxelpay_sessions", {
  id:            uuid("id").defaultRandom().primaryKey(),
  sessionId:     text("session_id").notNull().unique(),       // MaxelPay's sessionId
  orderId:       text("order_id").notNull().unique(),         // our internal orderId, sent to MaxelPay
  userId:        text("user_id").notNull().references(() => user.id),
  purpose:       text("purpose").notNull(),                    // "coin_purchase" | "subscription" | "deposit"
  // Links to whichever flow created this session
  linkedTxId:    text("linked_tx_id"),                         // walletTransactions.id
  linkedSubId:   uuid("linked_sub_id"),                        // subscriptions.id
  amountCents:   integer("amount_cents").notNull(),
  status:        text("status").notNull().default("pending"),  // pending | paid | partial | overpaid | expired | failed
  metadata:      text("metadata"),                              // JSON string
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  userIdIdx:    index("maxelpay_sessions_user_id_idx").on(t.userId),
  statusIdx:    index("maxelpay_sessions_status_idx").on(t.status),
}));

// ── reports ───────────────────────────────────────────────────────────────────
export const reports = pgTable("reports", {
  id:                uuid("id").defaultRandom().primaryKey(),
  reportedByUserId:  text("reported_by_user_id").notNull().references(() => user.id),
  reportedCreatorId: uuid("reported_creator_id").references(() => creators.id),
  reportedPostId:    uuid("reported_post_id").references(() => posts.id),
  type:              reportTypeEnum("type").notNull(),
  description:       text("description"),
  status:            reportStatusEnum("status").notNull().default("pending"),
  resolvedByAdminId: text("resolved_by_admin_id").references(() => user.id),
  resolvedAt:        timestamp("resolved_at"),
  createdAt:         timestamp("created_at").notNull().defaultNow(),
  updatedAt:         timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  statusIdx:    index("reports_status_idx").on(t.status),
  createdAtIdx: index("reports_created_at_idx").on(t.createdAt),
}));

// ── creator_wallets ───────────────────────────────────────────────────────────
export const creatorWallets = pgTable("creator_wallets", {
  id:        uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  currency:  text("currency").notNull(),
  network:   text("network").notNull(),
  address:   text("address").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, t => ({
  creatorIdx:    index("wallets_creator_idx").on(t.creatorId),
  uniqueDefault: uniqueIndex("wallets_unique_default_idx").on(t.creatorId, t.currency),
}));


// ══════════════════════════════════════════════════════════════════════════════
// CREATOR GOALS TABLE
// ══════════════════════════════════════════════════════════════════════════════

export const creatorGoals = pgTable("creator_goals", {
  id:            uuid("id").defaultRandom().primaryKey(),
  creatorId:     uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  title:         text("title").notNull(),
  description:   text("description"),
  goalType:      text("goal_type").notNull(), // 'subscribers', 'revenue', 'posts', 'custom'
  targetValue:   integer("target_value").notNull(),
  currentValue:  integer("current_value").notNull().default(0),
  deadline:      date("deadline"),
  isCompleted:   boolean("is_completed").notNull().default(false),
  completedAt:   timestamp("completed_at"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  creatorIdx: index("creator_goals_creator_idx").on(t.creatorId),
}));


// ══════════════════════════════════════════════════════════════════════════════
// SCHEDULED POSTS TABLE
// ══════════════════════════════════════════════════════════════════════════════

export const scheduledPosts = pgTable("scheduled_posts", {
  id:              uuid("id").defaultRandom().primaryKey(),
  creatorId:       uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  title:           text("title").notNull(),
  description:     text("description"),
  mediaType:       text("media_type").notNull(), // 'image' | 'video'
  mediaUrl:        text("media_url"),
  thumbnailUrl:    text("thumbnail_url"),
  isLocked:        boolean("is_locked").notNull().default(false),
  ppvPrice:        decimal("ppv_price", { precision: 10, scale: 2 }),
  scheduledFor:    timestamp("scheduled_for").notNull(),
  status:          text("status").notNull().default("draft"), // 'draft', 'scheduled', 'published', 'cancelled'
  publishedPostId: uuid("published_post_id").references(() => posts.id),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  creatorIdx:   index("scheduled_posts_creator_idx").on(t.creatorId),
  scheduledIdx: index("scheduled_posts_scheduled_idx").on(t.scheduledFor),
  statusIdx:    index("scheduled_posts_status_idx").on(t.status),
}));

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION HISTORY TABLE (for retention tracking)
// ══════════════════════════════════════════════════════════════════════════════

export const subscriptionHistory = pgTable("subscription_history", {
  id:             uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  userId:         text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  creatorId:      uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  tier:           text("tier").notNull(), // 'standard' | 'vip'
  action:         text("action").notNull(), // 'subscribed', 'cancelled', 'upgraded', 'downgraded', 'renewed'
  price:          decimal("price", { precision: 10, scale: 2 }),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
}, t => ({
  creatorIdx: index("subscription_history_creator_idx").on(t.creatorId),
  dateIdx:    index("subscription_history_date_idx").on(t.createdAt),
  actionIdx:  index("subscription_history_action_idx").on(t.action),
}));

// ══════════════════════════════════════════════════════════════════════════════
// TYPE INFERENCE
// ══════════════════════════════════════════════════════════════════════════════

export type CreatorGoal = typeof creatorGoals.$inferSelect;
export type NewCreatorGoal = typeof creatorGoals.$inferInsert;

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type NewScheduledPost = typeof scheduledPosts.$inferInsert;

export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type NewSubscriptionHistory = typeof subscriptionHistory.$inferInsert;

// ── messages ──────────────────────────────────────────────────────────────────
/**
 * Messages Table
 * Stores all direct messages between users and creators
 */
// db/schema.ts - Update messages table

export const messages = pgTable("messages", {
  id:           uuid("id").defaultRandom().primaryKey(),
  fromUserId:   text("from_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  toUserId:     text("to_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  content:      text("content"),
  
  // PPV Media fields
  mediaType:    text("media_type"), // 'image' | 'video' | null
  mediaUrl:     text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  isPpv:        boolean("is_ppv").notNull().default(false),
  ppvPrice:     decimal("ppv_price", { precision: 10, scale: 2 }),
  
  isRead:       boolean("is_read").notNull().default(false),
  readAt:       timestamp("read_at"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  fromUserIdx: index("messages_from_user_idx").on(t.fromUserId),
  toUserIdx:   index("messages_to_user_idx").on(t.toUserId),
  createdIdx:  index("messages_created_idx").on(t.createdAt),
}));

// New table for PPV purchases
export const ppvPurchases = pgTable("ppv_purchases", {
  id:          uuid("id").defaultRandom().primaryKey(),
  messageId:   uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId:      text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  pricePaid:   decimal("price_paid", { precision: 10, scale: 2 }).notNull(),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
}, t => ({
  messageIdx: index("ppv_purchases_message_idx").on(t.messageId),
  userIdx:    index("ppv_purchases_user_idx").on(t.userId),
}));

export type PPVPurchase = typeof ppvPurchases.$inferSelect;
export type NewPPVPurchase = typeof ppvPurchases.$inferInsert;

/**
 * Conversations Table
 * Tracks conversation metadata (last message, unread count, etc.)
 */
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),

  participant1Id: text("participant1_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  participant2Id: text("participant2_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Last message info
  lastMessageId: uuid("last_message_id"),
  lastMessageContent: text("last_message_content"),
  lastMessageAt: timestamp("last_message_at"),
  lastMessageSenderId: text("last_message_sender_id"), // 👈 new column

  unreadCountUser1: integer("unread_count_user1").notNull().default(0),
  unreadCountUser2: integer("unread_count_user2").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  participantsIdx: index("conv_participants_idx").on(t.participant1Id, t.participant2Id),
}));


// Type inference
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

// Track all media uploads for analytics/cleanup
export const mediaUploads = pgTable("media_uploads", {
  id:           uuid("id").defaultRandom().primaryKey(),
  userId:       text("user_id").notNull().references(() => user.id),
  blobName:     text("blob_name").notNull(),
  container:    text("container").notNull(),
  url:          text("url").notNull(),
  contentType:  text("content_type").notNull(),
  size:         integer("size").notNull(), // bytes
  width:        integer("width"),
  height:       integer("height"),
  isDeleted:    boolean("is_deleted").notNull().default(false),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, t => ({
  userIdx:      index("media_user_idx").on(t.userId),
  containerIdx: index("media_container_idx").on(t.container),
}));

// ── Relations ─────────────────────────────────────────────────────────────────
export const userRelations = relations(user, ({ one, many }) => ({
  profile:       one(profiles, { fields: [user.id], references: [profiles.id] }),
  agency:        one(agencies, { fields: [user.id], references: [agencies.userId] }),
  creator:       one(creators, { fields: [user.id], references: [creators.userId] }),
  subscriptions: many(subscriptions),
  tipsSent:      many(tips),
  ppvUnlocks:    many(ppvUnlocks),
  transactions:  many(transactions),
  sentMessages:  many(messages),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  user:     one(user,    { fields: [agencies.userId],  references: [user.id] }),
  creators: many(creators),
}));

export const creatorsRelations = relations(creators, ({ one, many }) => ({
  user:          one(user,     { fields: [creators.userId],   references: [user.id] }),
  agency:        one(agencies, { fields: [creators.agencyId], references: [agencies.id] }),
  posts:         many(posts),
  subscriptions: many(subscriptions),
  tipsReceived:  many(tips),
  payouts:       many(payouts),
  reports:       many(reports),
  wallets:       many(creatorWallets),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  creator:    one(creators,   { fields: [posts.creatorId], references: [creators.id] }),
  ppvUnlocks: many(ppvUnlocks),
  reports:    many(reports),
}));


export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",      // being set up, not visible to fans yet
  "active",     // live and accepting pledges
  "funded",     // goal amount reached
  "expired",    // deadline passed without reaching goal
  "cancelled",  // creator/agency pulled it
]);
 
// ─── Campaigns ──────────────────────────────────────────────────────────────
export const campaigns = pgTable("campaigns", {
  id:              uuid("id").defaultRandom().primaryKey(),
  creatorId:       uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
 
  // Who actually created it — same flow for creator vs agency, just attribution
  createdByUserId: text("created_by_user_id").notNull().references(() => user.id),
  createdByRole:   text("created_by_role").notNull().default("creator"), // "creator" | "agency"
 
  title:           text("title").notNull(),
  description:     text("description").notNull(),
  coverImageUrl:   text("cover_image_url"),
 
  goalAmount:      decimal("goal_amount", { precision: 10, scale: 2 }).notNull(),
  raisedAmount:    decimal("raised_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  pledgerCount:    integer("pledger_count").notNull().default(0),
 
  status:          campaignStatusEnum("status").notNull().default("draft"),
  deadline:        timestamp("deadline").notNull(),
 
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  creatorIdx:   index("campaigns_creator_idx").on(t.creatorId),
  statusIdx:    index("campaigns_status_idx").on(t.status),
  deadlineIdx:  index("campaigns_deadline_idx").on(t.deadline),
}));
 
// ─── Campaign Pledges ─────────────────────────────────────────────────────────
// One-time payments — no tiers, no recurring rewards. Just an amount + message.
export const campaignPledges = pgTable("campaign_pledges", {
  id:           uuid("id").defaultRandom().primaryKey(),
  campaignId:   uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  userId:       text("user_id").notNull().references(() => user.id),
 
  amount:       decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message:      text("message"),              // optional supporter note
  isAnonymous:  boolean("is_anonymous").notNull().default(false),
 
  paymentStatus: text("payment_status").notNull().default("completed"), // wire to your payment provider statuses
  paymentRef:    text("payment_ref"),
 
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  campaignIdx: index("pledges_campaign_idx").on(t.campaignId),
  userIdx:     index("pledges_user_idx").on(t.userId),
}));
 
export type CampaignRow = typeof campaigns.$inferSelect;
export type CampaignPledgeRow = typeof campaignPledges.$inferSelect;

// Campaign Donations Table
export const campaignDonations = pgTable("campaign_donations", {
  id:          uuid("id").defaultRandom().primaryKey(),
  campaignId:  uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  userId:      text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amount:      decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message:     text("message"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
}, t => ({
  campaignIdx: index("campaign_donations_campaign_idx").on(t.campaignId),
  userIdx:     index("campaign_donations_user_idx").on(t.userId),
  createdIdx:  index("campaign_donations_created_idx").on(t.createdAt),
}));

// Top Fan Badges Table
export const topFanBadges = pgTable("top_fan_badges", {
  id:         uuid("id").defaultRandom().primaryKey(),
  userId:     text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  creatorId:  uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  badgeType:  text("badge_type").notNull(), // 'top_donor', 'top_tipper', 'loyal_subscriber'
  earnedAt:   timestamp("earned_at").notNull().defaultNow(),
  metadata:   text("metadata"), // JSON string for additional info
}, t => ({
  userIdx:    index("top_fan_badges_user_idx").on(t.userId),
  creatorIdx: index("top_fan_badges_creator_idx").on(t.creatorId),
  uniquePair: index("top_fan_badges_unique_idx").on(t.userId, t.creatorId, t.badgeType),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CampaignDonation = typeof campaignDonations.$inferSelect;
export type NewCampaignDonation = typeof campaignDonations.$inferInsert;
export type TopFanBadge = typeof topFanBadges.$inferSelect;
export type NewTopFanBadge = typeof topFanBadges.$inferInsert;


// Auto Messages Table
export const autoMessages = pgTable("auto_messages", {
  id:          uuid("id").defaultRandom().primaryKey(),
  creatorId:   uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  triggerType: text("trigger_type").notNull(), // 'new_subscription', 'subscription_renewal', 'tip_received', 'ppv_unlock', 'birthday', 'custom_date'
  tier:        text("tier"), // 'standard', 'vip', null for all tiers
  messageText: text("message_text").notNull(),
  mediaUrl:    text("media_url"), // Optional image/video
  mediaType:   text("media_type"), // 'image' | 'video'
  delayMinutes: integer("delay_minutes").notNull().default(0), // Delay before sending (0 = immediate)
  isActive:    boolean("is_active").notNull().default(true),
  sentCount:   integer("sent_count").notNull().default(0),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  creatorIdx:  index("auto_messages_creator_idx").on(t.creatorId),
  triggerIdx:  index("auto_messages_trigger_idx").on(t.triggerType),
}));

// Auto Message Queue (for scheduled sends)
export const autoMessageQueue = pgTable("auto_message_queue", {
  id:            uuid("id").defaultRandom().primaryKey(),
  autoMessageId: uuid("auto_message_id").notNull().references(() => autoMessages.id, { onDelete: "cascade" }),
  userId:        text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  scheduledFor:  timestamp("scheduled_for").notNull(),
  status:        text("status").notNull().default("pending"), // 'pending', 'sent', 'failed'
  sentAt:        timestamp("sent_at"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
}, t => ({
  scheduledIdx: index("auto_message_queue_scheduled_idx").on(t.scheduledFor),
  statusIdx:    index("auto_message_queue_status_idx").on(t.status),
}));

export type AutoMessage = typeof autoMessages.$inferSelect;
export type NewAutoMessage = typeof autoMessages.$inferInsert;
export type AutoMessageQueue = typeof autoMessageQueue.$inferSelect;

export const rewardTypeEnum = pgEnum("reward_type", [
  "xp",
  "coins",
  "badge",
  "exclusive_content",
  "streak_freeze",
  "mystery_box",
]);
 
// ─── Day Config ───────────────────────────────────────────────────────────────
// Configures each reward slot (1–7) for a given fan pass season.
 
export const loginBonusDayConfig = pgTable("login_bonus_day_config", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").notNull(),
  daySlot: integer("day_slot").notNull(),       // 1 (Mon) → 7 (Sun)
  label: text("label").notNull(),               // "Mon", "Tue" …
  icon: text("icon").notNull(),                 // emoji
  rewardType: rewardTypeEnum("reward_type").notNull().default("xp"),
  rewardAmount: integer("reward_amount").notNull().default(25),
  rewardLabel: text("reward_label").notNull(),  // "+25 XP"
  isSpecialDay: boolean("is_special_day").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
 
// ─── Streak Milestones ────────────────────────────────────────────────────────
 
export const loginStreakMilestone = pgTable("login_streak_milestone", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").notNull(),
  streakDays: integer("streak_days").notNull(), // 3, 7, 14, 30
  title: text("title").notNull(),
  icon: text("icon").notNull(),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  rewardAmount: integer("reward_amount").notNull().default(0),
  rewardLabel: text("reward_label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
 
// ─── User Login Streak ────────────────────────────────────────────────────────
 
export const userLoginStreak = pgTable(
  "user_login_streak",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),           // references better-auth user id
    seasonId: integer("season_id").notNull(),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastClaimedAt: timestamp("last_claimed_at"),
    currentDaySlot: integer("current_day_slot").notNull().default(1),
    streakFreezes: integer("streak_freezes").notNull().default(0),
    totalXpEarned: integer("total_xp_earned").notNull().default(0),
    totalCoinsEarned: integer("total_coins_earned").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userSeasonIdx: uniqueIndex("user_season_idx").on(t.userId, t.seasonId),
  })
);
 
// ─── Daily Claim Log ──────────────────────────────────────────────────────────
 
export const loginClaimLog = pgTable("login_claim_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  seasonId: integer("season_id").notNull(),
  daySlot: integer("day_slot").notNull(),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  rewardAmount: integer("reward_amount").notNull(),
  streakAtClaim: integer("streak_at_claim").notNull(),
  isVip: boolean("is_vip").notNull().default(false),
  bonusMultiplier: integer("bonus_multiplier").notNull().default(1),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});
 
// ─── Milestone Claim Log ──────────────────────────────────────────────────────
 
export const milestoneClaimLog = pgTable(
  "milestone_claim_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    milestoneId: integer("milestone_id").notNull(),
    seasonId: integer("season_id").notNull(),
    claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  },
  (t) => ({
    userMilestoneIdx: uniqueIndex("user_milestone_idx").on(
      t.userId,
      t.milestoneId
    ),
  })
);
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export type LoginBonusDayConfig = typeof loginBonusDayConfig.$inferSelect;
export type LoginStreakMilestone = typeof loginStreakMilestone.$inferSelect;
export type UserLoginStreak = typeof userLoginStreak.$inferSelect;
export type LoginClaimLog = typeof loginClaimLog.$inferSelect;
export type MilestoneClaimLog = typeof milestoneClaimLog.$inferSelect;

export const shopItemTypeEnum = pgEnum("shop_item_type", [
  "badge",
  "booster_xp",
  "booster_coin",
  "gift",
  "vip_pass",
  "streak_freeze",
  "mystery_box",
  "emote",
]);
 
export const shopItemRarityEnum = pgEnum("shop_item_rarity", [
  "common",
  "rare",
  "epic",
  "legendary",
]);
 
export const shopCurrencyEnum = pgEnum("shop_currency", ["coins", "real"]);
 
// ─── Shop Items (catalog) ─────────────────────────────────────────────────────
 
export const shopItems = pgTable("shop_items", {
  id: text("id").primaryKey(),                          // e.g. "badge_flame"
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),                         // emoji
  type: shopItemTypeEnum("type").notNull(),
  category: text("category").notNull(),                 // matches ShopCategory
  rarity: shopItemRarityEnum("rarity").notNull().default("common"),
  coinPrice: integer("coin_price").notNull().default(0),
  realPriceCents: integer("real_price_cents"),           // null = coins only
  isCoinsOnly: boolean("is_coins_only").notNull().default(true),
  isRealMoneyOnly: boolean("is_real_money_only").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isLimitedTime: boolean("is_limited_time").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  stock: integer("stock"),                              // null = unlimited
  boosterMultiplier: integer("booster_multiplier"),     // e.g. 2 for 2×
  boosterDurationHours: integer("booster_duration_hours"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
 
// ─── User Inventory ───────────────────────────────────────────────────────────
 
export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),         // FK → shop_items.id
  quantity: integer("quantity").notNull().default(1),
  // For boosters: when the active boost expires
  boosterActiveUntil: timestamp("booster_active_until"),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  isEquipped:        boolean("is_equipped").default(false),
  source:            text("source").default("purchased"), // "purchased" | "mystery_box" | "fan_pass" | "quest"
  updatedAt:         timestamp("updated_at").defaultNow(),
});

// ─── Post Gifts ─────────────────────────────────────────────────────────────
export const postGifts = pgTable("post_gifts", {
  id:          serial("id").primaryKey(),
  postId:      text("post_id").notNull(),           // FK → posts.id
  senderId:    text("sender_id").notNull(),          // FK → user.id
  recipientId: text("recipient_id").notNull(),       // creator's userId
  itemId:      text("item_id").notNull(),            // FK → shop_items.id
  icon:        text("icon").notNull(),
  name:        text("name").notNull(),
  rarity:      text("rarity").notNull().default("common"),
  sentAt:      timestamp("sent_at").defaultNow().notNull(),
}, (t) => ({
  postIdIdx:   index("post_gifts_post_id_idx").on(t.postId),
  senderIdx:   index("post_gifts_sender_idx").on(t.senderId),
}));


 
// ─── Purchase Log ─────────────────────────────────────────────────────────────
 
export const shopPurchaseLog = pgTable("shop_purchase_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  currency: shopCurrencyEnum("currency").notNull(),
  coinAmount: integer("coin_amount"),       // coins spent (null if real money)
  realAmountCents: integer("real_amount_cents"), // null if coins
  coinsAfterPurchase: integer("coins_after_purchase"),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});
 
// ─── User Coin Balance ────────────────────────────────────────────────────────
// You may already have a coins column on your users table.
// If not, add this separate balance table.
 
export const userCoinBalance = pgTable("user_coin_balance", {
  userId: text("user_id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export type ShopItemRow       = typeof shopItems.$inferSelect;
export type UserInventoryRow  = typeof userInventory.$inferSelect;
export type ShopPurchaseLogRow = typeof shopPurchaseLog.$inferSelect;
export type UserCoinBalanceRow = typeof userCoinBalance.$inferSelect;
 

export const txTypeEnum = pgEnum("tx_type", [
  "deposit",
  "withdrawal",
  "subscription",
  "tip",
  "ppv",
  "coin_purchase",
  "coin_spend",
  "coin_earn",
  "refund",
  "creator_earning",
  "platform_fee",
  "crypto_deposit",
]);
 
export const txStatusEnum = pgEnum("tx_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);
 
export const txCurrencyEnum = pgEnum("tx_currency", ["usd", "coins", "crypto"]);
 
// ─── User Wallet ──────────────────────────────────────────────────────────────
 
export const userWallet = pgTable("user_wallet", {
  userId: text("user_id").primaryKey(),
  // USD balances (all in cents)
  usdBalance: integer("usd_balance").notNull().default(0),
  pendingBalance: integer("pending_balance").notNull().default(0),
  lifetimeDeposited: integer("lifetime_deposited").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeWithdrawn: integer("lifetime_withdrawn").notNull().default(0),
  // Coin balance (integer units)
  coinsBalance: integer("coins_balance").notNull().default(0),
  lifetimeCoinsEarned: integer("lifetime_coins_earned").notNull().default(0),
  lifetimeCoinsSpent: integer("lifetime_coins_spent").notNull().default(0),
  // KYC / payout eligibility
  isVerified: boolean("is_verified").notNull().default(false),
  canWithdraw: boolean("can_withdraw").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
 
// ─── Wallet Transactions ──────────────────────────────────────────────────────
 
export const walletTransactions = pgTable("wallet_transactions", {
  id: text("id").primaryKey(),                    // uuid
  userId: text("user_id").notNull(),
  type: txTypeEnum("type").notNull(),
  status: txStatusEnum("status").notNull().default("pending"),
  currency: txCurrencyEnum("currency").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  coinsAmount: integer("coins_amount").notNull().default(0),
  description: text("description").notNull(),
  // Optional metadata (JSON string)
  metadata: text("metadata"),
  // Optional linked entities
  linkedUserId: text("linked_user_id"),           // creator / other user
  linkedEntityId: text("linked_entity_id"),       // post / subscription id
  // External payment refs
  externalTxId: text("external_tx_id"),           // Maxelpay / crypto tx id
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
 
// ─── Coin Packages ────────────────────────────────────────────────────────────
 
export const coinPackages = pgTable("coin_packages", {
  id: text("id").primaryKey(),
  coins: integer("coins").notNull(),
  priceCents: integer("price_cents").notNull(),
  bonusCoins: integer("bonus_coins").notNull().default(0),
  isBestValue: boolean("is_best_value").notNull().default(false),
  isMostPopular: boolean("is_most_popular").notNull().default(false),
  cryptoEnabled: boolean("crypto_enabled").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});
 
// ─── Crypto Invoices ──────────────────────────────────────────────────────────
 
export const cryptoInvoices = pgTable("crypto_invoices", {
  id: text("id").primaryKey(),                    // uuid
  userId: text("user_id").notNull(),
  transactionId: text("transaction_id").notNull(),
  cryptoCurrency: text("crypto_currency").notNull(),  // BTC, ETH, USDT…
  cryptoAmount: text("crypto_amount").notNull(),
  walletAddress: text("wallet_address").notNull(),
  usdAmountCents: integer("usd_amount_cents").notNull(),
  status: txStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export type UserWalletRow       = typeof userWallet.$inferSelect;
export type WalletTransactionRow = typeof walletTransactions.$inferSelect;
export type CoinPackageRow      = typeof coinPackages.$inferSelect;
export type CryptoInvoiceRow    = typeof cryptoInvoices.$inferSelect;

export const notificationTypeEnum = pgEnum("notification_type", [
  "new_subscriber",
  "new_message",
  "new_tip",
  "new_like",
  "new_comment",
  "subscription_expiring",
  "new_post",
  "ppv_purchased",
  "campaign_milestone",
  "campaign_reward",
  "coin_earned",
  "level_up",
  "streak_reminder",
  "streak_broken",
  "shop_purchase",
  "withdrawal_approved",
  "withdrawal_rejected",
  "deposit_confirmed",
  "system",
  "welcome",
]);
 
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium",
  "high",
]);
 
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),               // uuid
    userId: text("user_id").notNull(),
    type: notificationTypeEnum("type").notNull(),
    priority: notificationPriorityEnum("priority").notNull().default("medium"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    icon: text("icon").notNull().default("🔔"),
    imageUrl: text("image_url"),
    actionUrl: text("action_url"),
    isRead: boolean("is_read").notNull().default(false),
    // Optional actor info (denormalised for perf)
    actorId: text("actor_id"),
    actorName: text("actor_name"),
    actorAvatar: text("actor_avatar"),
    entityId: text("entity_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    readAt: timestamp("read_at"),
  },
  (t) => ({
    userIdIdx:   index("notif_user_id_idx").on(t.userId),
    createdIdx:  index("notif_created_idx").on(t.createdAt),
    unreadIdx:   index("notif_unread_idx").on(t.userId, t.isRead),
  })
);
 
export type NotificationRow = typeof notifications.$inferSelect;

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "public", "followers", "private",
]);
export const messagePermissionEnum = pgEnum("message_permission", [
  "everyone", "subscribers", "nobody",
]);
export const themeModeEnum  = pgEnum("theme_mode",   ["dark", "light", "system"]);
export const accentColorEnum = pgEnum("accent_color", ["pink", "purple", "blue", "green", "orange", "red"]);
export const fontSizeEnum    = pgEnum("font_size",    ["small", "medium", "large"]);
export const contentLayoutEnum = pgEnum("content_layout", ["grid", "list"]);
 
// ─── Profile Settings ─────────────────────────────────────────────────────────
 
export const userProfileSettings = pgTable("user_profile_settings", {
  userId:      text("user_id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  username:    text("username").notNull().default(""),
  bio:         text("bio").notNull().default(""),
  location:    text("location").notNull().default(""),
  website:     text("website").notNull().default(""),
  avatarUrl:   text("avatar_url"),
  bannerUrl:   text("banner_url"),
  dateOfBirth: text("date_of_birth"),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});
 
// ─── Privacy Settings ─────────────────────────────────────────────────────────
 
export const userPrivacySettings = pgTable("user_privacy_settings", {
  userId:             text("user_id").primaryKey(),
  profileVisibility:  profileVisibilityEnum("profile_visibility").notNull().default("public"),
  showActivityStatus: boolean("show_activity_status").notNull().default(true),
  showSubscriptions:  boolean("show_subscriptions").notNull().default(false),
  allowTagging:       boolean("allow_tagging").notNull().default(true),
  messagePermission:  messagePermissionEnum("message_permission").notNull().default("subscribers"),
  allowComments:      boolean("allow_comments").notNull().default(true),
  showOnlineStatus:   boolean("show_online_status").notNull().default(true),
  activityVisibility: text("activity_visibility").notNull().default("private"),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
});
 
// ─── Notification Preferences ─────────────────────────────────────────────────
 
export const userNotificationPrefs = pgTable("user_notification_prefs", {
  userId:              text("user_id").primaryKey(),
  // In-app
  inAppNewSubscriber:  boolean("in_app_new_subscriber").notNull().default(true),
  inAppNewMessage:     boolean("in_app_new_message").notNull().default(true),
  inAppNewTip:         boolean("in_app_new_tip").notNull().default(true),
  inAppNewLike:        boolean("in_app_new_like").notNull().default(true),
  inAppNewComment:     boolean("in_app_new_comment").notNull().default(true),
  inAppNewPost:        boolean("in_app_new_post").notNull().default(true),
  inAppFanPass:        boolean("in_app_fan_pass").notNull().default(true),
  inAppWallet:         boolean("in_app_wallet").notNull().default(true),
  inAppSystem:         boolean("in_app_system").notNull().default(true),
  // Email
  emailNewSubscriber:  boolean("email_new_subscriber").notNull().default(true),
  emailNewMessage:     boolean("email_new_message").notNull().default(false),
  emailNewTip:         boolean("email_new_tip").notNull().default(true),
  emailMarketing:      boolean("email_marketing").notNull().default(false),
  emailWeeklyDigest:   boolean("email_weekly_digest").notNull().default(true),
  emailSecurityAlerts: boolean("email_security_alerts").notNull().default(true),
  // Push
  pushEnabled:         boolean("push_enabled").notNull().default(false),
  pushNewMessage:      boolean("push_new_message").notNull().default(true),
  pushNewSubscriber:   boolean("push_new_subscriber").notNull().default(true),
  pushNewTip:          boolean("push_new_tip").notNull().default(true),
  pushFanPass:         boolean("push_fan_pass").notNull().default(false),
  updatedAt:           timestamp("updated_at").defaultNow().notNull(),
});
 
// ─── Appearance Settings ──────────────────────────────────────────────────────
 
export const userAppearanceSettings = pgTable("user_appearance_settings", {
  userId:             text("user_id").primaryKey(),
  theme:              themeModeEnum("theme").notNull().default("dark"),
  accentColor:        accentColorEnum("accent_color").notNull().default("purple"),
  fontSize:           fontSizeEnum("font_size").notNull().default("medium"),
  contentLayout:      contentLayoutEnum("content_layout").notNull().default("grid"),
  reduceMotion:       boolean("reduce_motion").notNull().default(false),
  compactMode:        boolean("compact_mode").notNull().default(false),
  showExplicitContent: boolean("show_explicit_content").notNull().default(false),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
});
 
// ─── Active Sessions ──────────────────────────────────────────────────────────
 
export const userActiveSessions = pgTable("user_active_sessions", {
  id:         text("id").primaryKey(),
  userId:     text("user_id").notNull(),
  device:     text("device").notNull().default("Unknown"),
  browser:    text("browser").notNull().default("Unknown"),
  location:   text("location").notNull().default("Unknown"),
  ipAddress:  text("ip_address").notNull().default(""),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  isCurrent:  boolean("is_current").notNull().default(false),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export type UserProfileSettingsRow   = typeof userProfileSettings.$inferSelect;
export type UserPrivacySettingsRow   = typeof userPrivacySettings.$inferSelect;
export type UserNotificationPrefsRow = typeof userNotificationPrefs.$inferSelect;
export type UserAppearanceSettingsRow = typeof userAppearanceSettings.$inferSelect;
export type UserActiveSessionRow     = typeof userActiveSessions.$inferSelect;
 


export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "more_info_required",
]);
 
export const idDocumentTypeEnum = pgEnum("id_document_type", [
  "passport",
  "drivers_license",
  "national_id",
  "residence_permit",
]);
 
export const creatorApplication = pgTable("creator_applications", {
  id:              text("id").primaryKey(),
  userId:          text("user_id").notNull().unique(),
  status:          applicationStatusEnum("status").notNull().default("draft"),
  currentStep:     integer("current_step").notNull().default(1),
 
  // Step 1: Personal
  legalFirstName:  text("legal_first_name").notNull().default(""),
  legalLastName:   text("legal_last_name").notNull().default(""),
  dateOfBirth:     text("date_of_birth").notNull().default(""),
  country:         text("country").notNull().default(""),
  city:            text("city").notNull().default(""),
  address:         text("address").notNull().default(""),
  postalCode:      text("postal_code").notNull().default(""),
 
  // Step 2: Identity
  documentType:    idDocumentTypeEnum("document_type"),
  documentNumber:  text("document_number").notNull().default(""),
  documentExpiry:  text("document_expiry").notNull().default(""),
  documentFrontUrl: text("document_front_url"),
  documentBackUrl:  text("document_back_url"),
  selfieWithIdUrl:  text("selfie_with_id_url"),
  selfieUrl:        text("selfie_url"),
 
  // Step 3: Profile
  displayName:     text("display_name").notNull().default(""),
  username:        text("username").notNull().default(""),
  bio:             text("bio").notNull().default(""),
  categories:      text("categories").notNull().default("[]"),    // JSON array
  socialLinks:     text("social_links").notNull().default("{}"),  // JSON object
  subscriptionPrice: integer("subscription_price").notNull().default(499),
  hasPreviousExperience: boolean("has_previous_experience").notNull().default(false),
  previousPlatforms: text("previous_platforms").notNull().default(""),
  contentDescription: text("content_description").notNull().default(""),
 
  // Step 4: Payout
  payoutMethod:    text("payout_method").notNull().default("bank"),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankRoutingNumber: text("bank_routing_number"),
  bankName:        text("bank_name"),
  bankCountry:     text("bank_country"),
  cryptoWalletAddress: text("crypto_wallet_address"),
  cryptoCurrency:  text("crypto_currency"),
  taxCountry:      text("tax_country").notNull().default(""),
  taxId:           text("tax_id").notNull().default(""),
  isBusinessAccount: boolean("is_business_account").notNull().default(false),
  businessName:    text("business_name"),
 
  // Step 5: Agreements
  agreedToTerms:         boolean("agreed_to_terms").notNull().default(false),
  agreedToContentPolicy: boolean("agreed_to_content_policy").notNull().default(false),
  agreedToAge18:         boolean("agreed_to_age18").notNull().default(false),
  agreedToTaxObligations: boolean("agreed_to_tax_obligations").notNull().default(false),
  agreedToPrivacyPolicy: boolean("agreed_to_privacy_policy").notNull().default(false),
  signature:             text("signature").notNull().default(""),
 
  // Meta
  submittedAt:     timestamp("submitted_at"),
  reviewedAt:      timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  reviewedBy:      text("reviewed_by"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});
 
export type CreatorApplicationRow = typeof creatorApplication.$inferSelect;
 

export const seasonStatusEnum = pgEnum("season_status", [
  "draft",
  "active",
  "ended",
]);
 
export const rewardTrackTierEnum = pgEnum("reward_track_tier", [
  "free",
  "vip",
]);
 
export const rewardItemTypeEnum = pgEnum("reward_item_type", [
  "coins",
  "xp",
  "badge",
  "booster_xp",
  "booster_coin",
  "streak_freeze",
  "mystery_box",
  "exclusive_content",
  "emote",
  "vip_pass",
]);
 
export const itemRarityEnum = pgEnum("item_rarity", [
  "common",
  "rare",
  "epic",
  "legendary",
]);
 
// ─── Fan Pass Seasons ─────────────────────────────────────────────────────────
 
export const fanPassSeasons = pgTable("fan_pass_seasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  status: seasonStatusEnum("status").notNull().default("draft"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  vipPriceCents: integer("vip_price_cents").notNull().default(999),
  vipPriceCoins: integer("vip_price_coins").notNull().default(5000),
  maxLevel: integer("max_level").notNull().default(100),
  xpPerLevel: integer("xp_per_level").notNull().default(200),
  // Agency / creator ownership
  creatorId: text("creator_id"),   // null = platform-wide
  agencyId: text("agency_id"),     // null = not agency-owned
  // Cached stats (updated via cron/background job)
  totalParticipants: integer("total_participants").notNull().default(0),
  totalVipSubscribers: integer("total_vip_subscribers").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  featuredCreatorId:   text("featured_creator_id"),
featuredCreatorName: text("featured_creator_name"),
});
 
// ─── Pass Reward Track ────────────────────────────────────────────────────────
// Each row = one reward card in the battle-pass-style track
 
export const passRewardTrack = pgTable(
  "pass_reward_track",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id").notNull(),
    level: integer("level").notNull(),
    tier: rewardTrackTierEnum("tier").notNull(),          // "free" | "vip"
    icon: text("icon").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    rewardType: rewardItemTypeEnum("reward_type").notNull(),
    rewardAmount: integer("reward_amount").notNull().default(1),
    isVipOnly: boolean("is_vip_only").notNull().default(false),
    rarity: itemRarityEnum("rarity").notNull().default("common"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    rewardMeta: text("reward_meta"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    seasonLevelTierIdx: uniqueIndex("season_level_tier_idx").on(
      t.seasonId,
      t.level,
      t.tier
    ),
  })
);
 
// ─── User Reward Claims (reward track claims, separate from login bonus) ──────
 
export const userPassRewardClaims = pgTable(
  "user_pass_reward_claims",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    rewardId: integer("reward_id").notNull(),
    seasonId: integer("season_id").notNull(),
    claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  },
  (t) => ({
    userRewardIdx: uniqueIndex("user_reward_idx").on(t.userId, t.rewardId),
  })
);
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export type FanPassSeason      = typeof fanPassSeasons.$inferSelect;
export type PassRewardTrackRow = typeof passRewardTrack.$inferSelect;
export type UserPassRewardClaim = typeof userPassRewardClaims.$inferSelect;
 

/**
 * Add these tables to your existing db/schema.ts
 * Run: npx drizzle-kit push
 */


// ── Task type enum ─────────────────────────────────────────────────────────────

export const taskTypeEnum = pgEnum("task_type", ["weekly", "streak"]);
export const passTierEnum = pgEnum("pass_tier", ["free", "premium"]);

// ── Season Tasks (agency configures these) ────────────────────────────────────

export const seasonTasks = pgTable("season_tasks", {
  id:          serial("id").primaryKey(),
  seasonId:    integer("season_id").notNull(),
  title:       text("title").notNull(),
  description: text("description").notNull(),
  icon:        text("icon").notNull().default("⭐"),
  xpReward:    integer("xp_reward").notNull().default(50),
  coinReward:  integer("coin_reward").notNull().default(0),
  tier:        passTierEnum("tier").notNull().default("free"),  // free | premium
  type:        taskTypeEnum("type").notNull().default("weekly"), // weekly | streak
  isActive:    boolean("is_active").notNull().default(true),
  sortOrder:   integer("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
}, t => ({
  seasonIdx: index("season_tasks_season_idx").on(t.seasonId),
  tierIdx:   index("season_tasks_tier_idx").on(t.tier),
}));

// ── Weekly Task Assignments (randomized per user per week) ────────────────────
// One row per user per week. Stores which tasks were picked.

export const userWeeklyTasks = pgTable("user_weekly_tasks", {
  id:            serial("id").primaryKey(),
  userId:        text("user_id").notNull(),
  seasonId:      integer("season_id").notNull(),
  weekStartDate: timestamp("week_start_date").notNull(),
  weekEndDate:   timestamp("week_end_date").notNull(),
  // The two randomly assigned task IDs (JSON array: [freeTaskId, premiumTaskId])
  assignedTaskIds: text("assigned_task_ids").notNull().default("[]"),
  // Completion state (JSON: { taskId: completedAt ISO | null })
  completionState: text("completion_state").notNull().default("{}"),
  // Streak task progress (always task 3)
  streakProgress:  integer("streak_progress").notNull().default(0),
  streakCompleted: boolean("streak_completed").notNull().default(false),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
}, t => ({
  userWeekIdx: uniqueIndex("user_weekly_tasks_unique").on(t.userId, t.seasonId, t.weekStartDate),
}));

// ── User Season XP (reset when season ends) ───────────────────────────────────
// Separate from the existing userLoginStreak — tracks per-season XP/level.

export const userSeasonProgress = pgTable("user_season_progress", {
  id:           serial("id").primaryKey(),
  userId:       text("user_id").notNull(),
  seasonId:     integer("season_id").notNull(),
  level:        integer("level").notNull().default(1),
  totalXp:      integer("total_xp").notNull().default(0),
  isVip:        boolean("is_vip").notNull().default(false),
  loginStreak:  integer("login_streak").notNull().default(0),
  lastClaimedAt: timestamp("last_claimed_at"),
  // XP snapshot at season end (preserved for leaderboard history)
  finalXp:      integer("final_xp"),
  finalLevel:   integer("final_level"),
  resetAt:      timestamp("reset_at"),              // when XP was reset
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, t => ({
  userSeasonIdx: uniqueIndex("user_season_progress_unique").on(t.userId, t.seasonId),
  seasonIdx:     index("user_season_progress_season_idx").on(t.seasonId),
}));

// ── Reward Claims (per user per reward) ────────────────────────────────────────

export const rewardClaims = pgTable("reward_claims", {
  id:         serial("id").primaryKey(),
  userId:     text("user_id").notNull(),
  seasonId:   integer("season_id").notNull(),
  rewardId:   integer("reward_id").notNull(),
  claimedAt:  timestamp("claimed_at").defaultNow().notNull(),
}, t => ({
  userRewardUnique: uniqueIndex("reward_claims_unique").on(t.userId, t.rewardId),
}));

// ── Season XP Reset Log ───────────────────────────────────────────────────────

export const seasonXpResetLog = pgTable("season_xp_reset_log", {
  id:          serial("id").primaryKey(),
  seasonId:    integer("season_id").notNull(),
  affectedUsers: integer("affected_users").notNull().default(0),
  resetAt:     timestamp("reset_at").defaultNow().notNull(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type SeasonTask          = typeof seasonTasks.$inferSelect;
export type UserWeeklyTask      = typeof userWeeklyTasks.$inferSelect;
export type UserSeasonProgress  = typeof userSeasonProgress.$inferSelect;
export type RewardClaim         = typeof rewardClaims.$inferSelect;



// ─── Quest action types — used to match incoming user actions to quest types ──
export const questActionEnum = pgEnum("quest_action_type", [
  "like_post",
  "comment_post",
  "send_gift",
  "view_post",
  "subscribe",
  "login",
  "bookmark_post",
  "share_post",
]);
 
// ─── Status XP source — where did this XP come from, for auditing/analytics ──
export const xpSourceEnum = pgEnum("xp_source", [
  "fan_pass_quest",
  "fan_pass_levelup",
  "login_bonus",
  "milestone",
  "gift_sent",
  "subscription",
  "admin_grant",
]);
 
// ─── User Quest Progress ───────────────────────────────────────────────────────
// One row per (user, task). Incremented as the user performs the matching action.
// When current >= target, isCompleted flips true and the reward is auto-applied.
export const userQuestProgress = pgTable("user_quest_progress", {
  id:          serial("id").primaryKey(),
  userId:      text("user_id").notNull(),
  seasonId:    integer("season_id").notNull(),
  taskId:      integer("task_id").notNull(),       // references seasonTasks.id
  actionType:  questActionEnum("action_type").notNull(),
  current:     integer("current").notNull().default(0),
  target:      integer("target").notNull().default(1),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  rewardClaimed: boolean("reward_claimed").notNull().default(false),
  // Reset key — e.g. "2026-06-19" for daily quests, so progress resets when
  // the daily rotation picks a new quest set
  resetKey:    text("reset_key").notNull(),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userTaskResetIdx: uniqueIndex("quest_progress_user_task_reset_idx")
    .on(t.userId, t.taskId, t.resetKey),
  userSeasonIdx: index("quest_progress_user_season_idx").on(t.userId, t.seasonId),
}));
 
// ─── Status XP Log ──────────────────────────────────────────────────────────────
// Every XP-earning event writes a row here. The user's total statusXp
// (used for Explorer/Supporter/Fanatic/Presidential tier) is the SUM of all
// rows for that user — so Fan Pass participation directly feeds overall status.
export const statusXpLog = pgTable("status_xp_log", {
  id:        serial("id").primaryKey(),
  userId:    text("user_id").notNull(),
  amount:    integer("amount").notNull(),
  source:    xpSourceEnum("source").notNull(),
  sourceRef: text("source_ref"),     // e.g. taskId, seasonId, giftId — for traceability
  note:      text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userIdIdx: index("status_xp_log_user_id_idx").on(t.userId),
}));
 
// ─── Featured Creator Reward Media ──────────────────────────────────────────────
// When a user claims a reward of type "exclusive_content", we randomly pick one
// of the featured creator's locked/PPV posts and lock that choice in here so
// re-opening the reward always shows the SAME post (no re-roll on every view).
export const featuredCreatorRewardMedia = pgTable("featured_creator_reward_media", {
  id:        serial("id").primaryKey(),
  userId:    text("user_id").notNull(),
  seasonId:  integer("season_id").notNull(),
  rewardId:  integer("reward_id").notNull(),   // references passRewardTrack.id
  postId:    uuid("post_id").notNull(),        // references posts.id — the randomly chosen post
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userRewardIdx: uniqueIndex("featured_media_user_reward_idx").on(t.userId, t.rewardId),
}));

export const fanPassVipMembers = pgTable("fan_pass_vip_members", {
  id:           serial("id").primaryKey(),
  userId:       text("user_id").notNull(),
  seasonId:     integer("season_id").notNull(),
  purchasedAt:  timestamp("purchased_at").notNull().defaultNow(),
  expiresAt:    timestamp("expires_at"),       // null = lasts until season ends
  paymentRef:   text("payment_ref"),           // order id / transaction reference
}, (t) => ({
  userSeasonIdx: uniqueIndex("fanpass_vip_user_season_idx").on(t.userId, t.seasonId),
  }));
 
export type UserQuestProgressRow   = typeof userQuestProgress.$inferSelect;
export type StatusXpLogRow         = typeof statusXpLog.$inferSelect;
export type FeaturedRewardMediaRow = typeof featuredCreatorRewardMedia.$inferSelect;
export type FanPassVipMemberRow    = typeof fanPassVipMembers.$inferSelect;


