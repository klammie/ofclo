import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL = "Fanzluv <noreply@yourdomain.com>"; // ← change to your verified domain
export const SUPPORT_EMAIL = "support@yourdomain.com";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const APP_NAME = "Fanzluv";