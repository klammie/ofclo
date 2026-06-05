// app/lib/email-server.ts
"use server";

import { resend, FROM_EMAIL, APP_URL } from "./resend";
import {
  VerifyEmailTemplate,
  ForgotPasswordTemplate,
  TwoFactorCodeTemplate,
  NewSubscriberTemplate,
  SubscriptionConfirmTemplate,
  WelcomeTemplate,
} from "@/lib/emails/templates";

// ─── Verify email ─────────────────────────────────────────────────────────────
export async function sendVerifyEmail({ to, name, token }: { to: string; name: string; token: string }) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your Fanzluv email address",
    react: <VerifyEmailTemplate verifyUrl={verifyUrl} name={name} />,
  });
}

// ─── Forgot password ──────────────────────────────────────────────────────────
export async function sendForgotPasswordEmail({ to, name, token }: { to: string; name: string; token: string }) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your Fanzluv password",
    react: <ForgotPasswordTemplate resetUrl={resetUrl} name={name} />,
  });
}

// ─── 2FA code ─────────────────────────────────────────────────────────────────
export async function sendTwoFactorCode({ to, name, code }: { to: string; name: string; code: string }) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${code} is your Fanzluv login code`,
    react: <TwoFactorCodeTemplate code={code} name={name} />,
  });
}

// ─── New subscriber notification ──────────────────────────────────────────────
export async function sendNewSubscriberEmail(params: {
  creatorEmail: string;
  creatorName: string;
  subscriberName: string;
  tier: "standard" | "vip";
  amountCents: number | string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.creatorEmail,
    subject: `${params.subscriberName} just subscribed to your page! 🎉`,
    react: (
      <NewSubscriberTemplate
        creatorName={params.creatorName}
        subscriberName={params.subscriberName}
        tier={params.tier}
        amount={Number(params.amountCents)}
        dashboardUrl={`${APP_URL}/dashboard/creator/subscribers`}
      />
    ),
  });
}

// ─── Subscription confirmation ────────────────────────────────────────────────
export async function sendSubscriptionConfirmEmail(params: {
  subscriberEmail: string;
  subscriberName: string;
  creatorName: string;
  creatorUsername: string;
  tier: "standard" | "vip";
  amountCents: number | string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.subscriberEmail,
    subject: `You're now subscribed to ${params.creatorName}!`,
    react: (
      <SubscriptionConfirmTemplate
        subscriberName={params.subscriberName}
        creatorName={params.creatorName}
        creatorUsername={params.creatorUsername}
        tier={params.tier}
        amount={Number(params.amountCents)}
        creatorProfileUrl={`${APP_URL}/${params.creatorUsername}`}
      />
    ),
  });
}

// ─── Welcome email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Welcome to Fanzluv, ${name}! 🎉`,
    react: <WelcomeTemplate name={name} discoverUrl={`${APP_URL}/dashboard/user/discover`} />,
  });
}
