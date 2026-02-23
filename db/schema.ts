// db/schema.ts
// Add these BetterAuth core tables ALONGSIDE your existing app schema.
// BetterAuth will use these internally. Your app's `users` table stays as-is
// but BetterAuth's `user` table must exist — we map them via userId.
// Easiest pattern: let BetterAuth own `user`, and your `creators/agencies/etc`
// reference BetterAuth's user.id as a foreign key.

import {
  pgTable, pgEnum, text, integer, boolean,
  timestamp, decimal, uuid, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── BetterAuth core tables (required by drizzle adapter) ─────────────────────
// These are the exact column names BetterAuth expects.
// Do NOT rename them — the adapter maps to these directly.

export const user = pgTable("user", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  email:         text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image:         text("image"),
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
  id:            text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  username:      text("username").notNull().unique(),
  avatarUrl:     text("avatar_url"),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  usernameIdx: uniqueIndex("profiles_username_idx").on(t.username),
}));

// ── agencies ──────────────────────────────────────────────────────────────────
export const agencies = pgTable("agencies", {
  id:             uuid("id").defaultRandom().primaryKey(),
  userId:         text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  description:    text("description"),
  logoUrl:        text("logo_url"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("20.00"),
  isVerified:     boolean("is_verified").notNull().default(false),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  userIdIdx: index("agencies_user_id_idx").on(t.userId),
}));

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
  creatorId:    uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  title:        text("title").notNull(),
  description:  text("description"),
  contentType:  contentTypeEnum("content_type").notNull(),
  mediaUrl:     text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  isLocked:     boolean("is_locked").notNull().default(false),
  ppvPrice:     decimal("ppv_price", { precision: 10, scale: 2 }),
  likeCount:    integer("like_count").notNull().default(0),
  viewCount:    integer("view_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  isPublished:  boolean("is_published").notNull().default(true),
  scheduledAt:  timestamp("scheduled_at"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
}, t => ({
  creatorIdIdx: index("posts_creator_id_idx").on(t.creatorId),
  createdAtIdx: index("posts_created_at_idx").on(t.createdAt),
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

// ── tips ──────────────────────────────────────────────────────────────────────
export const tips = pgTable("tips", {
  id:              uuid("id").defaultRandom().primaryKey(),
  fromUserId:      text("from_user_id").notNull().references(() => user.id),
  toCreatorId:     uuid("to_creator_id").notNull().references(() => creators.id),
  amount:          decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message:         text("message"),
  isAnonymous:     boolean("is_anonymous").notNull().default(false),
  maxelpayOrderId: text("maxelpay_order_id"),
  cryptoCurrency:  text("crypto_currency"),
  paymentStatus:   cryptoPayStatusEnum("payment_status").notNull().default("initiated"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
}, t => ({
  toCreatorIdx: index("tips_to_creator_idx").on(t.toCreatorId),
  fromUserIdx:  index("tips_from_user_idx").on(t.fromUserId),
  orderIdx:     index("tips_order_id_idx").on(t.maxelpayOrderId),
}));

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

// ── messages ──────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id:         uuid("id").defaultRandom().primaryKey(),
  fromUserId: text("from_user_id").notNull().references(() => user.id),
  toUserId:   text("to_user_id").notNull().references(() => user.id),
  content:    text("content").notNull(),
  mediaUrl:   text("media_url"),
  isRead:     boolean("is_read").notNull().default(false),
  ppvPrice:   decimal("ppv_price", { precision: 10, scale: 2 }),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
}, t => ({
  fromUserIdx:  index("messages_from_idx").on(t.fromUserId),
  toUserIdx:    index("messages_to_idx").on(t.toUserId),
  createdAtIdx: index("messages_created_at_idx").on(t.createdAt),
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