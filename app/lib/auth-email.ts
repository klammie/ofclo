import {
  sendVerifyEmail,
  sendForgotPasswordEmail,
  sendWelcomeEmail,
} from "@/lib/email-server";

export const authEmailHandlers = {
  async sendVerificationEmail({ user, url }: { user: any; url: string }) {
    const token = new URL(url).searchParams.get("token") ?? url;
    await sendVerifyEmail({ to: user.email, name: user.name, token });
    await sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => null);
  },

  async sendResetPassword({ user, url }: { user: any; url: string }) {
    const token = new URL(url).searchParams.get("token") ?? url;
    await sendForgotPasswordEmail({ to: user.email, name: user.name, token });
  },
};
