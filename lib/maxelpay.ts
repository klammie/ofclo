// lib/maxelpay.ts
import { createHmac, timingSafeEqual } from "crypto";

const MAXELPAY_BASE_URL = process.env.MAXELPAY_BASE_URL ?? "https://api.maxelpay.com/api/v1";
const MAXELPAY_API_KEY  = process.env.MAXELPAY_API_KEY!;

if (!MAXELPAY_API_KEY) {
  console.warn("[maxelpay] MAXELPAY_API_KEY is not set — payments will fail");
}

export interface CreateSessionParams {
  orderId:      string;
  amount:       number;     // dollars, e.g. 9.99 — NOT cents
  currency?:    string;     // default "USD"
  description:  string;
  successUrl:   string;
  cancelUrl:    string;
  callbackUrl:  string;
}

export interface MaxelPaySession {
  sessionId:   string;
  checkoutUrl: string;
  status:      string;
  [key: string]: any;
}


export function maxelpayPublicUrl(): string {
  return process.env.MAXELPAY_PUBLIC_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? "https://yourdomain.com";
}

export function maxelpayCallbackUrl(): string {
  return `${maxelpayPublicUrl()}/api/wallet/maxelpay/webhook`;
}

// lib/maxelpay.ts

export async function createPaymentSession(params: CreateSessionParams): Promise<MaxelPaySession> {
  const res = await fetch(`${MAXELPAY_BASE_URL}/payments/sessions`, {
    method:  "POST",
    headers: {
      "X-API-KEY":    MAXELPAY_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId:     params.orderId,
      amount:      params.amount,
      currency:    params.currency ?? "USD",
      description: params.description,
      successUrl:  params.successUrl,
      cancelUrl:   params.cancelUrl,
      callbackUrl: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MaxelPay session creation failed (${res.status}): ${text}`);
  }

  const raw = await res.json();

  // Log the full raw response so we can see exactly what MaxelPay returns
  console.log("[maxelpay] raw session response:", JSON.stringify(raw, null, 2));

  // Normalize — MaxelPay may return sessionId, session_id, or id
  // This handles all three cases
  const sessionId =
    raw.sessionId    ??
    raw.session_id   ??
    raw.id           ??
    raw.data?.sessionId ??
    raw.data?.session_id ??
    raw.data?.id;

  const checkoutUrl =
    raw.checkoutUrl   ??
    raw.checkout_url  ??
    raw.paymentUrl    ??
    raw.payment_url   ??
    raw.url           ??
    raw.data?.checkoutUrl ??
    raw.data?.checkout_url ??
    raw.data?.paymentUrl ??
    raw.data?.url;

  if (!sessionId) {
    console.error("[maxelpay] Could not find sessionId in response:", raw);
    throw new Error(`MaxelPay response missing sessionId. Full response: ${JSON.stringify(raw)}`);
  }

  if (!checkoutUrl) {
    console.error("[maxelpay] Could not find checkoutUrl in response:", raw);
    throw new Error(`MaxelPay response missing checkoutUrl. Full response: ${JSON.stringify(raw)}`);
  }

  return {
    ...raw,
    sessionId,     // normalized
    checkoutUrl,   // normalized
  };
}

export async function getSessionStatus(sessionId: string): Promise<any> {
  const res = await fetch(`${MAXELPAY_BASE_URL}/payments/sessions/${sessionId}/status`, {
    headers: { "X-API-KEY": MAXELPAY_API_KEY },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MaxelPay session status check failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Webhook signature verification ──────────────────────────────────────────
// The public docs confirm a `X-MaxelPay-Signature` header is sent but don't
// specify the exact HMAC algorithm/secret source. Confirm this with
// support@maxelpay.com before going live — likely HMAC-SHA256 of the raw
// body using your API key (or a separate webhook secret) as the key, similar
// to Stripe/Maxio. Update the `secret` param once confirmed.




/**
 * Verifies the X-MaxelPay-Signature header.
 *
 * MaxelPay computes: HMAC-SHA256(rawBody, MAXELPAY_API_KEY)
 * This follows the standard pattern confirmed by their docs — the API key
 * acts as the HMAC secret, raw request body as the message.
 *
 * ⚠️  If verification keeps failing in staging, email support@maxelpay.com
 *     and ask exactly: "What is the HMAC algorithm and key used to sign the
 *     X-MaxelPay-Signature header?" and update accordingly.
 */
export function verifyMaxelPaySignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.MAXELPAY_API_KEY;
  if (!secret) {
    console.error("[maxelpay] MAXELPAY_API_KEY is not set — cannot verify signature");
    return false;
  }
  if (!signature) {
    console.error("[maxelpay] No X-MaxelPay-Signature header present");
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature.toLowerCase()),
      Buffer.from(expected.toLowerCase()),
    );
  } catch {
    // timingSafeEqual throws if buffers are different lengths
    return false;
  }
}