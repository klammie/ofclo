import { db } from "@/db";
import {
  userProfileSettings,
  userPrivacySettings,
  userNotificationPrefs,
  userAppearanceSettings,
  userActiveSessions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  ProfileSettings,
  AccountSettings,
  PrivacySettings,
  NotificationPreferences,
  AppearanceSettings,
  SecuritySettings,
  UserSettings,
  SaveResult,
} from "@/lib/types";

// ─── Get or create helpers ────────────────────────────────────────────────────

async function getOrCreateProfile(userId: string) {
  const row = await db.query.userProfileSettings.findFirst({ where: eq(userProfileSettings.userId, userId) });
  if (row) return row;
  await db.insert(userProfileSettings).values({ userId }).onConflictDoNothing();
  return db.query.userProfileSettings.findFirst({ where: eq(userProfileSettings.userId, userId) });
}

async function getOrCreatePrivacy(userId: string) {
  const row = await db.query.userPrivacySettings.findFirst({ where: eq(userPrivacySettings.userId, userId) });
  if (row) return row;
  await db.insert(userPrivacySettings).values({ userId }).onConflictDoNothing();
  return db.query.userPrivacySettings.findFirst({ where: eq(userPrivacySettings.userId, userId) });
}

async function getOrCreateNotifPrefs(userId: string) {
  const row = await db.query.userNotificationPrefs.findFirst({ where: eq(userNotificationPrefs.userId, userId) });
  if (row) return row;
  await db.insert(userNotificationPrefs).values({ userId }).onConflictDoNothing();
  return db.query.userNotificationPrefs.findFirst({ where: eq(userNotificationPrefs.userId, userId) });
}

async function getOrCreateAppearance(userId: string) {
  const row = await db.query.userAppearanceSettings.findFirst({ where: eq(userAppearanceSettings.userId, userId) });
  if (row) return row;
  await db.insert(userAppearanceSettings).values({ userId }).onConflictDoNothing();
  return db.query.userAppearanceSettings.findFirst({ where: eq(userAppearanceSettings.userId, userId) });
}

// ─── GET all settings ─────────────────────────────────────────────────────────

export async function getUserSettings(userId: string, userEmail: string, userName: string): Promise<UserSettings> {
  const [profile, privacy, notifPrefs, appearance, sessions] = await Promise.all([
    getOrCreateProfile(userId),
    getOrCreatePrivacy(userId),
    getOrCreateNotifPrefs(userId),
    getOrCreateAppearance(userId),
    db.query.userActiveSessions.findMany({ where: eq(userActiveSessions.userId, userId) }),
  ]);

  return {
    profile: {
      displayName: profile?.displayName ?? userName,
      username:    profile?.username    ?? "",
      bio:         profile?.bio         ?? "",
      location:    profile?.location    ?? "",
      website:     profile?.website     ?? "",
      avatarUrl:   profile?.avatarUrl   ?? null,
      bannerUrl:   profile?.bannerUrl   ?? null,
      dateOfBirth: profile?.dateOfBirth ?? null,
    },
    account: {
      email:           userEmail,
      phone:           null,
      language:        "en",
      currency:        "USD",
      timezone:        Intl.DateTimeFormat().resolvedOptions().timeZone,
      isEmailVerified: true,
      isPhoneVerified: false,
    },
    privacy: {
      profileVisibility:  (privacy?.profileVisibility  ?? "public")      as any,
      showActivityStatus: privacy?.showActivityStatus  ?? true,
      showSubscriptions:  privacy?.showSubscriptions   ?? false,
      allowTagging:       privacy?.allowTagging         ?? true,
      messagePermission:  (privacy?.messagePermission  ?? "subscribers")  as any,
      allowComments:      privacy?.allowComments        ?? true,
      showOnlineStatus:   privacy?.showOnlineStatus     ?? true,
      activityVisibility: (privacy?.activityVisibility ?? "private")      as any,
      blockedUserCount:   0,
      restrictedUserCount: 0,
      dataDownloadAvailable: true,
    },
    notifications: {
      inAppNewSubscriber:  notifPrefs?.inAppNewSubscriber  ?? true,
      inAppNewMessage:     notifPrefs?.inAppNewMessage     ?? true,
      inAppNewTip:         notifPrefs?.inAppNewTip         ?? true,
      inAppNewLike:        notifPrefs?.inAppNewLike        ?? true,
      inAppNewComment:     notifPrefs?.inAppNewComment     ?? true,
      inAppNewPost:        notifPrefs?.inAppNewPost        ?? true,
      inAppFanPass:        notifPrefs?.inAppFanPass        ?? true,
      inAppWallet:         notifPrefs?.inAppWallet         ?? true,
      inAppSystem:         notifPrefs?.inAppSystem         ?? true,
      emailNewSubscriber:  notifPrefs?.emailNewSubscriber  ?? true,
      emailNewMessage:     notifPrefs?.emailNewMessage     ?? false,
      emailNewTip:         notifPrefs?.emailNewTip         ?? true,
      emailMarketing:      notifPrefs?.emailMarketing      ?? false,
      emailWeeklyDigest:   notifPrefs?.emailWeeklyDigest   ?? true,
      emailSecurityAlerts: notifPrefs?.emailSecurityAlerts ?? true,
      pushEnabled:         notifPrefs?.pushEnabled         ?? false,
      pushNewMessage:      notifPrefs?.pushNewMessage      ?? true,
      pushNewSubscriber:   notifPrefs?.pushNewSubscriber   ?? true,
      pushNewTip:          notifPrefs?.pushNewTip          ?? true,
      pushFanPass:         notifPrefs?.pushFanPass         ?? false,
    },
    appearance: {
      theme:               (appearance?.theme         ?? "dark")   as any,
      accentColor:         (appearance?.accentColor   ?? "purple") as any,
      fontSize:            (appearance?.fontSize      ?? "medium") as any,
      contentLayout:       (appearance?.contentLayout ?? "grid")   as any,
      reduceMotion:        appearance?.reduceMotion   ?? false,
      compactMode:         appearance?.compactMode    ?? false,
      showExplicitContent: appearance?.showExplicitContent ?? false,
    },
    security: {
      twoFactorEnabled: false,
      twoFactorMethod:  null,
      loginAlerts:      true,
      activeSessions:   sessions.map((s) => ({
        id:         s.id,
        device:     s.device,
        browser:    s.browser,
        location:   s.location,
        ipAddress:  s.ipAddress,
        lastActive: s.lastActive.toISOString(),
        isCurrent:  s.isCurrent,
      })),
      loginHistory: [],
    },
  };
}

// ─── SAVE profile ─────────────────────────────────────────────────────────────

export async function saveProfileSettings(userId: string, data: Partial<ProfileSettings>): Promise<SaveResult> {
  await db
    .insert(userProfileSettings)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: userProfileSettings.userId,
      set: { ...data, updatedAt: new Date() },
    });
  return { success: true, message: "Profile updated successfully." };
}

// ─── SAVE privacy ─────────────────────────────────────────────────────────────

export async function savePrivacySettings(userId: string, data: Partial<PrivacySettings>): Promise<SaveResult> {
  const { blockedUserCount, restrictedUserCount, dataDownloadAvailable, ...rest } = data;
  await db
    .insert(userPrivacySettings)
    .values({ userId, ...rest, profileVisibility: rest.profileVisibility as any, messagePermission: rest.messagePermission as any })
    .onConflictDoUpdate({
      target: userPrivacySettings.userId,
      set: { ...rest, profileVisibility: rest.profileVisibility as any, messagePermission: rest.messagePermission as any, updatedAt: new Date() },
    });
  return { success: true, message: "Privacy settings saved." };
}

// ─── SAVE notification prefs ──────────────────────────────────────────────────

export async function saveNotificationPrefs(userId: string, data: Partial<NotificationPreferences>): Promise<SaveResult> {
  await db
    .insert(userNotificationPrefs)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: userNotificationPrefs.userId,
      set: { ...data, updatedAt: new Date() },
    });
  return { success: true, message: "Notification preferences saved." };
}

// ─── SAVE appearance ──────────────────────────────────────────────────────────

export async function saveAppearanceSettings(userId: string, data: Partial<AppearanceSettings>): Promise<SaveResult> {
  await db
    .insert(userAppearanceSettings)
    .values({ userId, ...data, theme: data.theme as any, accentColor: data.accentColor as any, fontSize: data.fontSize as any, contentLayout: data.contentLayout as any })
    .onConflictDoUpdate({
      target: userAppearanceSettings.userId,
      set: { ...data, theme: data.theme as any, accentColor: data.accentColor as any, fontSize: data.fontSize as any, contentLayout: data.contentLayout as any, updatedAt: new Date() },
    });
  return { success: true, message: "Appearance settings saved." };
}

// ─── Revoke session ───────────────────────────────────────────────────────────

export async function revokeSession(sessionId: string, userId: string): Promise<SaveResult> {
  await db
    .delete(userActiveSessions)
    .where(and(eq(userActiveSessions.id, sessionId), eq(userActiveSessions.userId, userId)));
  return { success: true, message: "Session revoked." };
}