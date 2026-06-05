/**
 * Email templates for Fanzluv
 * All built as React Email components and sent via Resend.
 *
 * Install: npm install resend @react-email/components
 */

import Head from "next/head";
import * as React from "react";

// ─── Shared brand colours ─────────────────────────────────────────────────────
const PINK    = "#ef3976";
const PURPLE  = "#7c3aed";
const DARK    = "#0d0d1a";
const CARD    = "#1a1635";
const TEXT    = "#f0eaff";
const MUTED   = "#a0a0c8";

// ─── Base wrapper ─────────────────────────────────────────────────────────────
function EmailBase({ children, preview }: { children: React.ReactNode; preview: string }) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{preview}</title>
      </Head>
      <body style={{ background: DARK, margin: 0, padding: "40px 20px", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        {/* Preview text (hidden in email body, shown in inbox preview) */}
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden", color: DARK }}>
          {preview}
        </div>

        {/* Logo header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
            borderRadius: 12,
            padding: "8px 20px",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px" }}>
              Fanzluv
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          maxWidth: 520,
          margin: "0 auto",
          background: CARD,
          borderRadius: 20,
          border: `1px solid rgba(124,58,237,0.25)`,
          overflow: "hidden",
        }}>
          {/* Top accent line */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${PURPLE}, ${PINK})` }} />
          <div style={{ padding: "32px 36px" }}>
            {children}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
            © {new Date().getFullYear()} Fanzluv · All rights reserved
          </p>
          <p style={{ color: "rgba(160,160,200,0.5)", fontSize: 11, margin: "4px 0 0" }}>
            You received this email because you have an account on Fanzluv.
          </p>
        </div>
      </body>
    </html>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.3px" }}>{children}</h1>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>{children}</p>;
}

function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{
      display: "inline-block",
      background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
      color: "#fff",
      fontWeight: 900,
      fontSize: 14,
      borderRadius: 12,
      padding: "13px 32px",
      textDecoration: "none",
      boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
    }}>
      {children}
    </a>
  );
}

function Divider() {
  return <hr style={{ border: "none", borderTop: "1px solid rgba(124,58,237,0.12)", margin: "24px 0" }} />;
}

function CodeBox({ code }: { code: string }) {
  return (
    <div style={{
      background: "rgba(124,58,237,0.1)",
      border: "1px solid rgba(124,58,237,0.25)",
      borderRadius: 12,
      padding: "16px",
      textAlign: "center",
      margin: "20px 0",
    }}>
      <span style={{
        color: TEXT,
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: "0.15em",
        fontFamily: "monospace",
      }}>
        {code}
      </span>
    </div>
  );
}

function SmallNote({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "rgba(160,160,200,0.6)", fontSize: 12, margin: "12px 0 0", lineHeight: 1.6 }}>{children}</p>;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. EMAIL VERIFICATION
// ══════════════════════════════════════════════════════════════════════════════

export function VerifyEmailTemplate({ verifyUrl, name }: { verifyUrl: string; name: string }) {
  return (
    <EmailBase preview={`Verify your Fanzluv email address`}>
      <Heading>Verify your email address</Heading>
      <Body>
        Hey {name}! Welcome to Fanzluv. Click the button below to verify your email address
        and activate your account.
      </Body>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Button href={verifyUrl}>Verify Email Address</Button>
      </div>
      <Divider />
      <SmallNote>
        Or copy this link into your browser:{" "}
        <span style={{ color: PINK, wordBreak: "break-all" }}>{verifyUrl}</span>
      </SmallNote>
      <SmallNote>This link expires in 24 hours. If you didn&apos;t create an account, you can ignore this email.</SmallNote>
    </EmailBase>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════════════════════

export function ForgotPasswordTemplate({ resetUrl, name }: { resetUrl: string; name: string }) {
  return (
    <EmailBase preview="Reset your Fanzluv password">
      <Heading>Reset your password</Heading>
      <Body>
        Hey {name}! We received a request to reset your Fanzluv password.
        Click the button below to choose a new password.
      </Body>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Button href={resetUrl}>Reset Password</Button>
      </div>
      <Divider />
      <SmallNote>
        Or copy this link: <span style={{ color: PINK, wordBreak: "break-all" }}>{resetUrl}</span>
      </SmallNote>
      <SmallNote>
        This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email.
        Your password will not change until you click the link above.
      </SmallNote>
    </EmailBase>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. TWO-FACTOR AUTH CODE
// ══════════════════════════════════════════════════════════════════════════════

export function TwoFactorCodeTemplate({ code, name }: { code: string; name: string }) {
  return (
    <EmailBase preview={`Your Fanzluv login code: ${code}`}>
      <Heading>Your login verification code</Heading>
      <Body>
        Hey {name}! Enter this code to complete your login. It expires in 10 minutes.
      </Body>
      <CodeBox code={code} />
      <Divider />
      <SmallNote>
        If you didn&apos;t try to log in to Fanzluv, someone may have your password.
        We recommend changing it immediately.
      </SmallNote>
    </EmailBase>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. NEW SUBSCRIBER NOTIFICATION (creator receives this)
// ══════════════════════════════════════════════════════════════════════════════

export function NewSubscriberTemplate({
  creatorName,
  subscriberName,
  subscriberAvatar,
  tier,
  amount,
  dashboardUrl,
}: {
  creatorName: string;
  subscriberName: string;
  subscriberAvatar?: string;
  tier: "standard" | "vip";
  amount: number; // cents
  dashboardUrl: string;
}) {
  const isVip    = tier === "vip";
  const tierColor = isVip ? "#fbbf24" : PINK;

  return (
    <EmailBase preview={`${subscriberName} just subscribed to your page!`}>
      <Heading>You have a new subscriber! 🎉</Heading>

      {/* Subscriber info card */}
      <div style={{
        background: "rgba(239,57,118,0.06)",
        border: `1px solid rgba(239,57,118,0.2)`,
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        margin: "20px 0",
      }}>
        {/* Avatar circle */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 900,
          color: "#fff",
        }}>
          {subscriberName.charAt(0).toUpperCase()}
        </div>

        <div>
          <p style={{ color: TEXT, fontWeight: 900, fontSize: 16, margin: 0 }}>{subscriberName}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{
              background: isVip ? "rgba(251,191,36,0.15)" : "rgba(239,57,118,0.15)",
              color: tierColor,
              border: `1px solid ${isVip ? "rgba(251,191,36,0.3)" : "rgba(239,57,118,0.3)"}`,
              borderRadius: 999,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
            }}>
              {isVip ? "⭐ VIP" : "Standard"}
            </span>
            <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 14 }}>
              +${(amount / 100).toFixed(2)}/mo
            </span>
          </div>
        </div>
      </div>

      <Body>
        Hey {creatorName}! Great news — <strong style={{ color: TEXT }}>{subscriberName}</strong> just
        subscribed to your page on the {isVip ? "VIP" : "Standard"} tier for{" "}
        <strong style={{ color: "#4ade80" }}>${(amount / 100).toFixed(2)}/month</strong>.
        Head to your dashboard to see your updated earnings.
      </Body>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Button href={dashboardUrl}>View Your Dashboard</Button>
      </div>

      <Divider />
      <SmallNote>Keep creating great content and watch your subscriber count grow! 🚀</SmallNote>
    </EmailBase>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. SUBSCRIPTION CONFIRMATION (subscriber receives this)
// ══════════════════════════════════════════════════════════════════════════════

export function SubscriptionConfirmTemplate({
  subscriberName,
  creatorName,
  creatorUsername,
  tier,
  amount,
  creatorProfileUrl,
}: {
  subscriberName: string;
  creatorName: string;
  creatorUsername: string;
  tier: "standard" | "vip";
  amount: number;
  creatorProfileUrl: string;
}) {
  const isVip = tier === "vip";
  return (
    <EmailBase preview={`You're now subscribed to ${creatorName}!`}>
      <Heading>Subscription confirmed! 🎉</Heading>
      <Body>
        Hey {subscriberName}! You&apos;re now subscribed to{" "}
        <strong style={{ color: TEXT }}>{creatorName}</strong> on the{" "}
        <strong style={{ color: isVip ? "#fbbf24" : PINK }}>{isVip ? "VIP" : "Standard"}</strong> plan
        for <strong style={{ color: "#4ade80" }}>${(amount / 100).toFixed(2)}/month</strong>.
        You now have full access to their exclusive content!
      </Body>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Button href={creatorProfileUrl}>View {creatorName}&apos;s Page</Button>
      </div>
      <Divider />
      <SmallNote>
        Your subscription renews monthly. You can cancel anytime from your Subscriptions page.
        Questions? Contact {" "}
        <a href="mailto:support@yourdomain.com" style={{ color: PINK }}>support</a>.
      </SmallNote>
    </EmailBase>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. WELCOME EMAIL
// ══════════════════════════════════════════════════════════════════════════════

export function WelcomeTemplate({ name, discoverUrl }: { name: string; discoverUrl: string }) {
  return (
    <EmailBase preview={`Welcome to Fanzluv, ${name}!`}>
      <Heading>Welcome to Fanzluv! 🎉</Heading>
      <Body>
        Hey {name}! Your account is ready. Start discovering amazing creators,
        subscribe to your favourites, and earn Fan Pass rewards just for being active.
      </Body>

      {/* Feature highlights */}
      {[
        { icon: "🎟️", title: "Fan Pass",    desc: "Earn XP, unlock rewards and level up"     },
        { icon: "💰", title: "Earn Coins",   desc: "Complete quests and get bonus coins"       },
        { icon: "✨", title: "Discover",     desc: "Find creators you'll love"                 },
      ].map((f) => (
        <div key={f.title} style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "12px 0", borderBottom: "1px solid rgba(124,58,237,0.08)",
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
          <div>
            <p style={{ color: TEXT, fontWeight: 700, fontSize: 13, margin: 0 }}>{f.title}</p>
            <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 0" }}>{f.desc}</p>
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: 28, marginBottom: 8 }}>
        <Button href={discoverUrl}>Discover Creators</Button>
      </div>
    </EmailBase>
  );
}