// lib/maxelpay.ts
// Server-only — never import in "use client" components
// Based on MaxelPay API: https://api.maxelpay.com/v1/{env}/merchant/order/checkout

import CryptoJS from "crypto-js";

// ── Config ────────────────────────────────────────────────────────────────────
const MAXELPAY_API_KEY    = process.env.MAXELPAY_API_KEY!;
const MAXELPAY_API_SECRET = process.env.MAXELPAY_API_SECRET!;
const MAXELPAY_ENV        = process.env.MAXELPAY_ENV ?? "stg"; // "stg" | "prod"
const BASE_URL            = `https://api.maxelpay.com/v1/${MAXELPAY_ENV}/merchant`;
const SITE_NAME           = process.env.NEXT_PUBLIC_SITE_NAME ?? "FanVault";
const WEBSITE_URL         = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MaxelPayCheckoutPayload {
  orderID:     string;
  amount:      string;   // USD string e.g. "9.99"
  currency:    "USD";
  timestamp:   string;   // Unix seconds as string
  userName:    string;
  siteName:    string;
  userEmail:   string;
  redirectUrl: string;
  websiteUrl:  string;
  cancelUrl:   string;
  webhookUrl:  string;
}

export interface MaxelPayCheckoutResponse {
  success:     boolean;
  checkoutUrl: string;   // URL to redirect user to
  orderId:     string;
}

export interface MaxelPayWebhookEvent {
  orderId:       string;
  status:        "completed" | "failed" | "expired" | "pending";
  amount:        string;
  currency:      string;   // crypto symbol e.g. "USDT"
  network:       string;   // e.g. "ERC20"
  txHash:        string;
  timestamp:     string;
  metadata?:     Record<string, string>;
}

// ── Payload encryption (AES using API Secret) ─────────────────────────────────
// MaxelPay requires the JSON payload to be AES-encrypted before sending
function encryptPayload(payload: object): string {
  const json = JSON.stringify(payload);
  return CryptoJS.AES.encrypt(json, MAXELPAY_API_SECRET).toString();
}

// ── Webhook HMAC-SHA256 verification ─────────────────────────────────────────
export function verifyWebhookSignature(
  rawBody:   string,
  signature: string   // value of x-maxelpay-signature header
): boolean {
  const expected = CryptoJS.HmacSHA256(rawBody, MAXELPAY_API_SECRET).toString(
    CryptoJS.enc.Hex
  );
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ── Create checkout session ───────────────────────────────────────────────────
export async function createCheckout(
  params: {
    orderId:     string;   // your internal unique order ID
    amountUsd:   number;
    userEmail:   string;
    userName:    string;
    redirectUrl: string;   // success page
    cancelUrl:   string;   // cancel/back page
    webhookUrl:  string;   // your /api/webhooks/maxelpay endpoint
  }
): Promise<MaxelPayCheckoutResponse> {

  const payload: MaxelPayCheckoutPayload = {
    orderID:     params.orderId,
    amount:      params.amountUsd.toFixed(2),
    currency:    "USD",
    timestamp:   Math.floor(Date.now() / 1000).toString(),
    userName:    params.userName,
    siteName:    SITE_NAME,
    userEmail:   params.userEmail,
    redirectUrl: params.redirectUrl,
    websiteUrl:  WEBSITE_URL,
    cancelUrl:   params.cancelUrl,
    webhookUrl:  params.webhookUrl,
  };

  const encryptedPayload = encryptPayload(payload);

  const response = await fetch(`${BASE_URL}/order/checkout`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "x-api-key":     MAXELPAY_API_KEY,
    },
    body: JSON.stringify({ data: encryptedPayload }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`MaxelPay checkout failed: ${response.status} — ${err}`);
  }

  const result = await response.json();
  return {
    success:     true,
    checkoutUrl: result.checkoutUrl ?? result.data?.checkoutUrl,
    orderId:     params.orderId,
  };
}

// ── Initiate payout to creator wallet ────────────────────────────────────────
export async function initiatePayout(params: {
  payoutId:           string;   // internal payout record ID
  amountUsd:          number;
  destinationAddress: string;
  currency:           string;   // "USDT" | "ETH" | "BNB"
  network:            string;   // "ERC20" | "BEP20" | "TRC20"
  creatorEmail:       string;
  creatorName:        string;
}): Promise<{ transferId: string }> {

  const payload = {
    payoutID:           params.payoutId,
    amount:             params.amountUsd.toFixed(2),
    currency:           "USD",
    cryptoCurrency:     params.currency,
    network:            params.network,
    destinationAddress: params.destinationAddress,
    timestamp:          Math.floor(Date.now() / 1000).toString(),
    recipientName:      params.creatorName,
    recipientEmail:     params.creatorEmail,
    webhookUrl:         `${WEBSITE_URL}/api/webhooks/maxelpay/payout`,
  };

  const encryptedPayload = encryptPayload(payload);

  const response = await fetch(`${BASE_URL}/payout/initiate`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key":    MAXELPAY_API_KEY,
    },
    body: JSON.stringify({ data: encryptedPayload }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`MaxelPay payout failed: ${response.status} — ${err}`);
  }

  const result = await response.json();
  return { transferId: result.transferId ?? result.data?.transferId };
}

// ── Generate a unique order ID ────────────────────────────────────────────────
// Format: fanvault_<type>_<userId_prefix>_<timestamp>_<random>
export function generateOrderId(
  type: "sub" | "ppv" | "tip" | "payout",
  userId: string
): string {
  const ts     = Date.now().toString(36);
  const rand   = Math.random().toString(36).slice(2, 7);
  const prefix = userId.replace(/-/g, "").slice(0, 8);
  return `fanvault_${type}_${prefix}_${ts}_${rand}`;
}