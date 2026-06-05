"use client";

import { useState, useRef } from "react";
import type {
  ProfileSettings, AccountSettings, PrivacySettings,
  NotificationPreferences, AppearanceSettings, SecuritySettings,
  ActiveSession,
} from "@/lib/types";
import {
  Section, SettingRow, Toggle, Input, Textarea, Select,
  SaveButton, DangerButton, RadioGroup, P, V, GRAD, CARD, SURF, BORDER,
} from "@/components/settings/SettingsUi";

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE TAB
// ══════════════════════════════════════════════════════════════════════════════

export function ProfileTab({ initial, onSave, isSaving, saved }: {
  initial: ProfileSettings; onSave: (d: Partial<ProfileSettings>) => void;
  isSaving: boolean; saved: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof ProfileSettings) => (v: string) => setForm((p) => ({ ...p, [k]: v }));
  const avatarRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar / Banner */}
      <Section title="Profile Picture & Banner">
        <div className="p-5 flex flex-col gap-4">
          {/* Banner */}
          <div className="relative h-28 rounded-xl overflow-hidden border flex items-center justify-center cursor-pointer group"
            style={{ background: "rgba(124,58,237,0.08)", borderColor: BORDER }}>
            {form.bannerUrl
              ? <img src={form.bannerUrl} className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center gap-2 opacity-40">
                  <span className="text-2xl">🖼️</span>
                  <p className="text-[11px] font-bold text-[#f0eaff]">Click to upload banner</p>
                </div>
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[11px] font-black text-white">Change Banner</span>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="size-20 rounded-full border-4 overflow-hidden flex items-center justify-center text-2xl font-black"
                style={{ background: "rgba(124,58,237,0.2)", borderColor: V + "60", color: V }}>
                {form.avatarUrl
                  ? <img src={form.avatarUrl} className="size-full object-cover" />
                  : (form.displayName || "U")[0]?.toUpperCase()
                }
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#f0eaff]">Profile Avatar</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.4)" }}>
                JPG, PNG or GIF · Max 5MB · Recommended 400×400
              </p>
              <button className="mt-2 text-[11px] font-black px-3 py-1.5 rounded-lg border transition-all"
                style={{ background: "rgba(124,58,237,0.1)", borderColor: BORDER, color: V }}>
                Upload Photo
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Basic info */}
      <Section title="Basic Information">
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Display Name" value={form.displayName} onChange={set("displayName")} placeholder="Your name" />
            <Input label="Username" value={form.username} onChange={set("username")} placeholder="@username" hint="Only letters, numbers and underscores" />
          </div>
          <Textarea label="Bio" value={form.bio} onChange={set("bio")} placeholder="Tell others about yourself…" rows={3} maxLength={300} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Location" value={form.location} onChange={set("location")} placeholder="City, Country" />
            <Input label="Website" value={form.website} onChange={set("website")} placeholder="https://yoursite.com" type="url" />
          </div>
          <Input label="Date of Birth" value={form.dateOfBirth ?? ""} onChange={set("dateOfBirth")} type="date"
            hint="Not shown publicly — used for age verification" />
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton onClick={() => onSave(form)} isSaving={isSaving} saved={saved} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACCOUNT TAB
// ══════════════════════════════════════════════════════════════════════════════

export function AccountTab({ initial, onSave, isSaving, saved }: {
  initial: AccountSettings; onSave: (d: Partial<AccountSettings>) => void;
  isSaving: boolean; saved: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [showChangePassword, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const set = (k: keyof AccountSettings) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const LANGUAGES = [
    { value: "en", label: "English" }, { value: "es", label: "Spanish" },
    { value: "fr", label: "French"  }, { value: "de", label: "German"  },
    { value: "pt", label: "Portuguese" }, { value: "ja", label: "Japanese" },
  ];
  const CURRENCIES = [
    { value: "USD", label: "USD — US Dollar" }, { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" }, { value: "CAD", label: "CAD — Canadian Dollar" },
    { value: "AUD", label: "AUD — Australian Dollar" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Section title="Email Address">
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input label="Email" value={form.email} onChange={set("email")} type="email" />
            </div>
            <div className="mt-5">
              {form.isEmailVerified
                ? <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>✓ Verified</span>
                : <button className="text-[10px] font-black px-3 py-1.5 rounded-lg border" style={{ background: "rgba(239,57,118,0.1)", borderColor: "rgba(239,57,118,0.3)", color: P }}>Verify</button>
              }
            </div>
          </div>
        </div>
      </Section>

      <Section title="Phone Number">
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input label="Phone" value={form.phone ?? ""} onChange={(v) => setForm(p => ({ ...p, phone: v }))} type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="mt-5">
              {form.isPhoneVerified
                ? <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>✓ Verified</span>
                : <button className="text-[10px] font-black px-3 py-1.5 rounded-lg border" style={{ background: "rgba(239,57,118,0.1)", borderColor: "rgba(239,57,118,0.3)", color: P }}>Add & Verify</button>
              }
            </div>
          </div>
        </div>
      </Section>

      <Section title="Password">
        <div className="p-5">
          {!showChangePassword ? (
            <button onClick={() => setShowPw(true)}
              className="text-[12px] font-black px-4 py-2 rounded-xl border transition-all"
              style={{ background: "rgba(124,58,237,0.08)", borderColor: BORDER, color: V }}>
              🔒 Change Password
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <Input label="Current Password" value={pw.current} onChange={(v) => setPw(p => ({ ...p, current: v }))} type="password" />
              <Input label="New Password" value={pw.newPw} onChange={(v) => setPw(p => ({ ...p, newPw: v }))} type="password" hint="Minimum 8 characters" />
              <Input label="Confirm New Password" value={pw.confirm} onChange={(v) => setPw(p => ({ ...p, confirm: v }))} type="password" />
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowPw(false)} className="text-[12px] font-bold px-4 py-2 rounded-xl border"
                  style={{ borderColor: BORDER, color: "rgba(240,234,255,0.5)" }}>Cancel</button>
                <button className="text-[12px] font-black px-4 py-2 rounded-xl text-white"
                  style={{ background: GRAD }}>Update Password</button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Preferences">
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Language" value={form.language} onChange={set("language")} options={LANGUAGES} />
            <Select label="Currency" value={form.currency} onChange={set("currency")} options={CURRENCIES} />
          </div>
        </div>
      </Section>

      <Section title="Danger Zone">
        <div className="p-5 flex flex-col gap-3">
          <SettingRow label="Deactivate Account" description="Temporarily hide your profile and content." danger>
            <DangerButton onClick={() => alert("Deactivate account flow")}>Deactivate</DangerButton>
          </SettingRow>
          <SettingRow label="Delete Account" description="Permanently delete your account and all data. This cannot be undone." danger>
            <DangerButton onClick={() => alert("Delete account flow")}>Delete Account</DangerButton>
          </SettingRow>
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton onClick={() => onSave(form)} isSaving={isSaving} saved={saved} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRIVACY TAB
// ══════════════════════════════════════════════════════════════════════════════

export function PrivacyTab({ initial, onSave, isSaving, saved }: {
  initial: PrivacySettings; onSave: (d: Partial<PrivacySettings>) => void;
  isSaving: boolean; saved: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof PrivacySettings) => (v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-6">
      <Section title="Profile Visibility" description="Control who can see your profile and content.">
        <div className="p-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(240,234,255,0.4)" }}>Who can see your profile</p>
            <RadioGroup value={form.profileVisibility} onChange={set("profileVisibility")} options={[
              { value: "public",    label: "Public",     icon: "🌍" },
              { value: "followers", label: "Followers",  icon: "👥" },
              { value: "private",   label: "Private",    icon: "🔒" },
            ]} />
          </div>
        </div>
        <SettingRow label="Show Activity Status" description="Let others see when you were last active.">
          <Toggle checked={form.showActivityStatus} onChange={set("showActivityStatus")} />
        </SettingRow>
        <SettingRow label="Show Online Status" description="Show a green dot when you're online.">
          <Toggle checked={form.showOnlineStatus} onChange={set("showOnlineStatus")} />
        </SettingRow>
        <SettingRow label="Show Subscriptions" description="Allow others to see who you're subscribed to.">
          <Toggle checked={form.showSubscriptions} onChange={set("showSubscriptions")} />
        </SettingRow>
      </Section>

      <Section title="Interactions" description="Control how others can interact with you.">
        <div className="p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(240,234,255,0.4)" }}>Who can message you</p>
            <RadioGroup value={form.messagePermission} onChange={set("messagePermission")} options={[
              { value: "everyone",    label: "Everyone",    icon: "🌍" },
              { value: "subscribers", label: "Subscribers", icon: "⭐" },
              { value: "nobody",      label: "Nobody",      icon: "🚫" },
            ]} />
          </div>
        </div>
        <SettingRow label="Allow Comments" description="Let fans comment on your posts and activity.">
          <Toggle checked={form.allowComments} onChange={set("allowComments")} />
        </SettingRow>
        <SettingRow label="Allow Tagging" description="Allow others to mention you in their posts.">
          <Toggle checked={form.allowTagging} onChange={set("allowTagging")} />
        </SettingRow>
      </Section>

      <Section title="Blocked & Restricted Users">
        <SettingRow label="Blocked Users" description={`${form.blockedUserCount} users blocked`}>
          <button className="text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-all"
            style={{ background: "rgba(124,58,237,0.08)", borderColor: BORDER, color: V }}>
            Manage
          </button>
        </SettingRow>
        <SettingRow label="Restricted Users" description={`${form.restrictedUserCount} users restricted`}>
          <button className="text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-all"
            style={{ background: "rgba(124,58,237,0.08)", borderColor: BORDER, color: V }}>
            Manage
          </button>
        </SettingRow>
      </Section>

      <Section title="Your Data">
        <SettingRow label="Download Your Data" description="Get a copy of everything Fanzluv has stored about you.">
          <button className="text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-all"
            style={{ background: "rgba(124,58,237,0.08)", borderColor: BORDER, color: V }}>
            Request Download
          </button>
        </SettingRow>
      </Section>

      <div className="flex justify-end">
        <SaveButton onClick={() => onSave(form)} isSaving={isSaving} saved={saved} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ══════════════════════════════════════════════════════════════════════════════

export function NotificationsTab({ initial, onSave, isSaving, saved }: {
  initial: NotificationPreferences; onSave: (d: Partial<NotificationPreferences>) => void;
  isSaving: boolean; saved: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof NotificationPreferences) => (v: boolean) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-6">
      <Section title="In-App Notifications" description="Control which notifications appear in your notification panel.">
        <SettingRow label="New Subscribers" description="When someone subscribes to you."><Toggle checked={form.inAppNewSubscriber} onChange={set("inAppNewSubscriber")} /></SettingRow>
        <SettingRow label="New Messages"    description="When you receive a direct message."><Toggle checked={form.inAppNewMessage} onChange={set("inAppNewMessage")} /></SettingRow>
        <SettingRow label="Tips & Gifts"    description="When someone tips you or sends a gift."><Toggle checked={form.inAppNewTip} onChange={set("inAppNewTip")} /></SettingRow>
        <SettingRow label="Likes"           description="When someone likes your content."><Toggle checked={form.inAppNewLike} onChange={set("inAppNewLike")} /></SettingRow>
        <SettingRow label="Comments"        description="When someone comments on your posts."><Toggle checked={form.inAppNewComment} onChange={set("inAppNewComment")} /></SettingRow>
        <SettingRow label="New Content"     description="When creators you subscribe to post new content."><Toggle checked={form.inAppNewPost} onChange={set("inAppNewPost")} /></SettingRow>
        <SettingRow label="Fan Pass"        description="Level ups, streaks, rewards and milestones."><Toggle checked={form.inAppFanPass} onChange={set("inAppFanPass")} /></SettingRow>
        <SettingRow label="Wallet"          description="Deposits, withdrawals and purchases."><Toggle checked={form.inAppWallet} onChange={set("inAppWallet")} /></SettingRow>
        <SettingRow label="System"          description="Important platform announcements."><Toggle checked={form.inAppSystem} onChange={set("inAppSystem")} /></SettingRow>
      </Section>

      <Section title="Email Notifications" description="We'll send these to your registered email address.">
        <SettingRow label="New Subscribers"  description="Subscriber notifications via email."><Toggle checked={form.emailNewSubscriber} onChange={set("emailNewSubscriber")} /></SettingRow>
        <SettingRow label="New Messages"     description="Message notifications via email."><Toggle checked={form.emailNewMessage} onChange={set("emailNewMessage")} /></SettingRow>
        <SettingRow label="Tips & Earnings"  description="Tip and earning alerts via email."><Toggle checked={form.emailNewTip} onChange={set("emailNewTip")} /></SettingRow>
        <SettingRow label="Weekly Digest"    description="A summary of your week every Monday."><Toggle checked={form.emailWeeklyDigest} onChange={set("emailWeeklyDigest")} /></SettingRow>
        <SettingRow label="Security Alerts"  description="Login alerts and account security emails." ><Toggle checked={form.emailSecurityAlerts} onChange={set("emailSecurityAlerts")} /></SettingRow>
        <SettingRow label="Marketing Emails" description="Product updates, promotions and offers."><Toggle checked={form.emailMarketing} onChange={set("emailMarketing")} /></SettingRow>
      </Section>

      <Section title="Push Notifications" description="Browser and mobile push notifications.">
        <SettingRow label="Enable Push Notifications" description="Allow Fanzluv to send push notifications.">
          <Toggle checked={form.pushEnabled} onChange={set("pushEnabled")} />
        </SettingRow>
        <SettingRow label="New Messages"    description="Push alert for direct messages." ><Toggle checked={form.pushNewMessage} onChange={set("pushNewMessage")} disabled={!form.pushEnabled} /></SettingRow>
        <SettingRow label="New Subscribers" description="Push alert for new subscribers."  ><Toggle checked={form.pushNewSubscriber} onChange={set("pushNewSubscriber")} disabled={!form.pushEnabled} /></SettingRow>
        <SettingRow label="Tips & Gifts"    description="Push alert for tips and gifts."   ><Toggle checked={form.pushNewTip} onChange={set("pushNewTip")} disabled={!form.pushEnabled} /></SettingRow>
        <SettingRow label="Fan Pass"        description="Push alert for streaks and rewards."><Toggle checked={form.pushFanPass} onChange={set("pushFanPass")} disabled={!form.pushEnabled} /></SettingRow>
      </Section>

      <div className="flex justify-end">
        <SaveButton onClick={() => onSave(form)} isSaving={isSaving} saved={saved} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APPEARANCE TAB
// ══════════════════════════════════════════════════════════════════════════════

const ACCENT_COLORS = [
  { id: "pink",   color: "#ef3976", label: "Pink"   },
  { id: "purple", color: "#7c3aed", label: "Purple" },
  { id: "blue",   color: "#3b82f6", label: "Blue"   },
  { id: "green",  color: "#22c55e", label: "Green"  },
  { id: "orange", color: "#fb923c", label: "Orange" },
  { id: "red",    color: "#ef4444", label: "Red"    },
];

export function AppearanceTab({ initial, onSave, isSaving, saved }: {
  initial: AppearanceSettings; onSave: (d: Partial<AppearanceSettings>) => void;
  isSaving: boolean; saved: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof AppearanceSettings) => (v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-6">
      <Section title="Theme" description="Choose your preferred colour scheme.">
        <div className="p-5">
          <RadioGroup value={form.theme} onChange={set("theme")} options={[
            { value: "dark",   label: "Dark",   icon: "🌙" },
            { value: "light",  label: "Light",  icon: "☀️" },
            { value: "system", label: "System", icon: "💻" },
          ]} />
        </div>
      </Section>

      <Section title="Accent Colour" description="The highlight colour used throughout the app.">
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((c) => (
              <button key={c.id} onClick={() => set("accentColor")(c.id)}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black transition-all"
                style={form.accentColor === c.id
                  ? { background: c.color + "20", borderColor: c.color, color: "#f0eaff" }
                  : { background: "rgba(255,255,255,0.02)", borderColor: BORDER, color: "rgba(240,234,255,0.5)" }}>
                <span className="size-3.5 rounded-full shrink-0" style={{ background: c.color }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Content Layout" description="How posts and media are displayed in your feed.">
        <div className="p-5">
          <RadioGroup value={form.contentLayout} onChange={set("contentLayout")} options={[
            { value: "grid", label: "Grid",  icon: "⊞" },
            { value: "list", label: "List",  icon: "☰" },
          ]} />
        </div>
      </Section>

      <Section title="Font Size">
        <div className="p-5">
          <RadioGroup value={form.fontSize} onChange={set("fontSize")} options={[
            { value: "small",  label: "Small"  },
            { value: "medium", label: "Medium" },
            { value: "large",  label: "Large"  },
          ]} />
        </div>
      </Section>

      <Section title="Accessibility & Display">
        <SettingRow label="Reduce Motion" description="Minimise animations and transitions throughout the app.">
          <Toggle checked={form.reduceMotion} onChange={set("reduceMotion")} />
        </SettingRow>
        <SettingRow label="Compact Mode" description="Reduce spacing and show more content on screen.">
          <Toggle checked={form.compactMode} onChange={set("compactMode")} />
        </SettingRow>
        <SettingRow label="Show Explicit Content" description="Display 18+ content in your feed (requires age verification)." danger>
          <Toggle checked={form.showExplicitContent} onChange={set("showExplicitContent")} />
        </SettingRow>
      </Section>

      <div className="flex justify-end">
        <SaveButton onClick={() => onSave(form)} isSaving={isSaving} saved={saved} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY TAB
// ══════════════════════════════════════════════════════════════════════════════

export function SecurityTab({ initial, onRevokeSession }: {
  initial: SecuritySettings; onRevokeSession: (id: string) => void;
}) {
  const [twoFactor, setTwoFactor] = useState(initial.twoFactorEnabled);
  const [loginAlerts, setLoginAlerts] = useState(initial.loginAlerts);

  return (
    <div className="flex flex-col gap-6">
      <Section title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
        <SettingRow label="Enable 2FA" description={twoFactor ? "2FA is active. Your account is protected." : "Protect your account with an authenticator app or SMS."}>
          <div className="flex items-center gap-3">
            {twoFactor && (
              <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                Active
              </span>
            )}
            <Toggle checked={twoFactor} onChange={setTwoFactor} />
          </div>
        </SettingRow>
        {twoFactor && (
          <div className="px-5 py-4 flex flex-col gap-3 border-t" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
            <p className="text-[11px] font-bold text-[#f0eaff]">2FA Method</p>
            <RadioGroup value={initial.twoFactorMethod ?? "app"} onChange={() => {}} options={[
              { value: "app", label: "Authenticator App", icon: "📱" },
              { value: "sms", label: "SMS",               icon: "💬" },
            ]} />
            <button className="self-start text-[12px] font-black px-4 py-2 rounded-xl text-white mt-2"
              style={{ background: GRAD }}>
              Configure 2FA
            </button>
          </div>
        )}
        <SettingRow label="Login Alerts" description="Get notified when your account is accessed from a new device.">
          <Toggle checked={loginAlerts} onChange={setLoginAlerts} />
        </SettingRow>
      </Section>

      <Section title="Active Sessions" description="Devices currently logged into your account.">
        <div className="flex flex-col">
          {initial.activeSessions.length === 0 ? (
            <div className="px-5 py-6 flex flex-col items-center gap-2">
              <span className="text-3xl">📱</span>
              <p className="text-[12px]" style={{ color: "rgba(240,234,255,0.4)" }}>No active sessions found</p>
            </div>
          ) : (
            initial.activeSessions.map((session) => (
              <SessionRow key={session.id} session={session} onRevoke={onRevokeSession} />
            ))
          )}
        </div>
      </Section>

      <Section title="Account Security">
        <SettingRow label="Trusted Devices" description="Manage devices you've marked as trusted.">
          <button className="text-[12px] font-bold px-3 py-1.5 rounded-lg border"
            style={{ background: "rgba(124,58,237,0.08)", borderColor: BORDER, color: V }}>
            Manage
          </button>
        </SettingRow>
        <SettingRow label="Sign Out All Devices" description="Immediately log out of all sessions." danger>
          <DangerButton onClick={() => alert("Sign out all sessions")}>Sign Out All</DangerButton>
        </SettingRow>
      </Section>
    </div>
  );
}

function SessionRow({ session, onRevoke }: { session: ActiveSession; onRevoke: (id: string) => void }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b last:border-b-0" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
      <div className="size-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: "rgba(124,58,237,0.1)" }}>
        {session.device.toLowerCase().includes("mobile") ? "📱" : "💻"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-[#f0eaff]">{session.browser} · {session.device}</p>
          {session.isCurrent && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
              This device
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(240,234,255,0.4)" }}>
          {session.location} · {session.ipAddress}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.3)" }}>
          Last active {new Date(session.lastActive).toLocaleDateString()}
        </p>
      </div>
      {!session.isCurrent && (
        <DangerButton onClick={() => onRevoke(session.id)}>Revoke</DangerButton>
      )}
    </div>
  );
}