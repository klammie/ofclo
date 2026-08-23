// app/api/wallet/maxelpay/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  maxelpaySessions,
  walletTransactions,
  userWallet,
  subscriptions,
  userCoinBalance,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyMaxelPaySignature } from "@/lib/maxelpay";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ack() {
  // MaxelPay expects a 200 to stop retrying
  return NextResponse.json({ received: true }, { status: 200 });
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get("x-maxelpay-signature");

  // ── Signature verification ─────────────────────────────────────────────────
  // In staging you can temporarily set MAXELPAY_SKIP_SIG_VERIFY=true in your
  // .env to bypass this while you confirm the exact signing scheme.
  // NEVER set this in production.
  const skipVerify = process.env.MAXELPAY_SKIP_SIG_VERIFY === "true"
    && process.env.NODE_ENV !== "production";

  if (!skipVerify) {
    const isValid = verifyMaxelPaySignature(rawBody, signature);
    if (!isValid) {
      console.error(
        "[maxelpay/webhook] Signature verification failed.\n" +
        `  Received: ${signature}\n` +
        "  If this keeps happening in staging, confirm the signing scheme\n" +
        "  with support@maxelpay.com and update verifyMaxelPaySignature().\n" +
        "  You can set MAXELPAY_SKIP_SIG_VERIFY=true in .env.local to bypass\n" +
        "  during testing (never in production)."
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[maxelpay/webhook] ⚠️  Signature verification SKIPPED (dev mode)");
  }

  // ── Parse payload ──────────────────────────────────────────────────────────
  let payload: {
    event: string;
    timestamp: string;
    data: {
      sessionId:     string;
      orderId:       string;
      status:        string;
      amount:        number;
      currency:      string;
      paidAmount?:   number;
      totalPaidUsd?: number;
      txHash?:       string;
      network?:      string;
      tokenSymbol?:  string;
      customerEmail?:string;
      metadata?:     Record<string, any>;
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[maxelpay/webhook] Failed to parse JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = payload;
  const { sessionId, txHash, orderId } = data;

  console.log(`[maxelpay/webhook] event=${event} sessionId=${sessionId} orderId=${orderId}`);

  if (!sessionId) {
    console.error("[maxelpay/webhook] Missing sessionId in payload");
    return ack(); // ack so MaxelPay doesn't retry a malformed event forever
  }

  try {
    // ── Look up our session record ────────────────────────────────────────────
    const mpSession = await db.query.maxelpaySessions.findFirst({
      where: eq(maxelpaySessions.sessionId, sessionId),
    });

    if (!mpSession) {
      console.warn(`[maxelpay/webhook] Unknown sessionId: ${sessionId} — acking to stop retries`);
      return ack();
    }

    // ── Idempotency guard ─────────────────────────────────────────────────────
    // If we already processed this as "paid", don't double-credit.
    if (mpSession.status === "paid" && event === "payment.completed") {
      console.log(`[maxelpay/webhook] Already processed session ${sessionId} — skipping`);
      return ack();
    }

    // ── Route by event type ───────────────────────────────────────────────────

    switch (event) {

      case "payment.completed": {
        await db.update(maxelpaySessions)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(maxelpaySessions.id, mpSession.id));

        // ── deposit ──────────────────────────────────────────────────────────
        if (mpSession.purpose === "deposit" && mpSession.linkedTxId) {
          await Promise.all([
            db.update(walletTransactions)
              .set({
                status:       "completed",
                externalTxId: txHash ?? sessionId,
                updatedAt:    new Date(),
              })
              .where(eq(walletTransactions.id, mpSession.linkedTxId)),

            db.update(userWallet)
              .set({
                usdBalance:        sql`${userWallet.usdBalance} + ${mpSession.amountCents}`,
                lifetimeDeposited: sql`${userWallet.lifetimeDeposited} + ${mpSession.amountCents}`,
                updatedAt:         new Date(),
              })
              .where(eq(userWallet.userId, mpSession.userId)),
          ]);

          console.log(`[maxelpay/webhook] ✅ Deposit credited: +$${(mpSession.amountCents / 100).toFixed(2)} for user ${mpSession.userId}`);
        }

        // ── coin_purchase ────────────────────────────────────────────────────
        if (mpSession.purpose === "coin_purchase" && mpSession.linkedTxId) {
  const meta       = mpSession.metadata ? JSON.parse(mpSession.metadata) : {};
  const totalCoins = Number(meta.totalCoins ?? 0);

  const existingCoinBalance = await db.query.userCoinBalance.findFirst({
    where: eq(userCoinBalance.userId, mpSession.userId),
  });

  await Promise.all([
    db.update(walletTransactions)
      .set({ status: "completed", externalTxId: txHash ?? sessionId, updatedAt: new Date() })
      .where(eq(walletTransactions.id, mpSession.linkedTxId)),

    ...(totalCoins > 0 ? [
      // Sync userWallet
      db.update(userWallet)
        .set({
          coinsBalance:        sql`${userWallet.coinsBalance} + ${totalCoins}`,
          lifetimeCoinsEarned: sql`${userWallet.lifetimeCoinsEarned} + ${totalCoins}`,
          lifetimeSpent:       sql`${userWallet.lifetimeSpent} + ${mpSession.amountCents}`,
          updatedAt:           new Date(),
        })
        .where(eq(userWallet.userId, mpSession.userId)),

      // Sync userCoinBalance
      existingCoinBalance
        ? db.update(userCoinBalance)
            .set({
              balance:        sql`${userCoinBalance.balance} + ${totalCoins}`,
              lifetimeEarned: sql`${userCoinBalance.lifetimeEarned} + ${totalCoins}`,
              updatedAt:      new Date(),
            })
            .where(eq(userCoinBalance.userId, mpSession.userId))
        : db.insert(userCoinBalance).values({
            userId:         mpSession.userId,
            balance:        totalCoins,
            lifetimeEarned: totalCoins,
            lifetimeSpent:  0,
            updatedAt:      new Date(),
          }),
    ] : []),
  ]);
}

        // ── subscription ─────────────────────────────────────────────────────
        // subStatusEnum has no "pending" — we insert subs as "active" with
        // paymentStatus="initiated", then flip paymentStatus to "completed"
        // here. The subscription was already visible as active so no UX gap.
        if (mpSession.purpose === "subscription" && mpSession.linkedSubId) {
          await db.update(subscriptions)
            .set({
              paymentStatus: "completed",
              updatedAt:     new Date(),
            })
            .where(eq(subscriptions.id, mpSession.linkedSubId));

          console.log(`[maxelpay/webhook] ✅ Subscription confirmed: ${mpSession.linkedSubId}`);
        }

        break;
      }

      case "payment.expired":
      case "payment.failed": {
        await db.update(maxelpaySessions)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(maxelpaySessions.id, mpSession.id));

        if (mpSession.linkedTxId) {
          await db.update(walletTransactions)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(walletTransactions.id, mpSession.linkedTxId));
        }

        // Cancel the subscription since payment didn't go through
        if (mpSession.purpose === "subscription" && mpSession.linkedSubId) {
          await db.update(subscriptions)
            .set({
              status:        "cancelled",
              paymentStatus: "failed",
              cancelledAt:   new Date(),
              updatedAt:     new Date(),
            })
            .where(eq(subscriptions.id, mpSession.linkedSubId));
        }

        console.log(`[maxelpay/webhook] ❌ Payment ${event} for session ${sessionId}`);
        break;
      }

      case "payment.partial": {
        await db.update(maxelpaySessions)
          .set({ status: "partial", updatedAt: new Date() })
          .where(eq(maxelpaySessions.id, mpSession.id));

        // Don't credit anything — underpayment needs manual resolution.
        // Log clearly for your ops team.
        console.warn(
          `[maxelpay/webhook] ⚠️  PARTIAL PAYMENT for session ${sessionId}\n` +
          `  Required: $${data.amount} | Paid: $${data.paidAmount ?? "?"}\n` +
          `  User: ${mpSession.userId} | Purpose: ${mpSession.purpose}\n` +
          `  Manual action required — contact user or refund via MaxelPay dashboard.`
        );
        break;
      }

      case "payment.overpaid": {
        // Treat as paid — credit the expected amount, not the overpaid amount.
        // MaxelPay typically refunds the difference automatically.
        await db.update(maxelpaySessions)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(maxelpaySessions.id, mpSession.id));

        console.warn(
          `[maxelpay/webhook] ⚠️  OVERPAYMENT for session ${sessionId}\n` +
          `  Required: $${data.amount} | Paid: $${data.totalPaidUsd ?? data.paidAmount ?? "?"}\n` +
          `  Treating as completed — MaxelPay should refund the difference.`
        );

        // Re-use the payment.completed logic by falling through
        // by re-dispatching internally (avoids code duplication):
        if (mpSession.purpose === "deposit" && mpSession.linkedTxId) {
          await Promise.all([
            db.update(walletTransactions)
              .set({ status: "completed", externalTxId: txHash ?? sessionId, updatedAt: new Date() })
              .where(eq(walletTransactions.id, mpSession.linkedTxId)),
            db.update(userWallet)
              .set({
                usdBalance:        sql`${userWallet.usdBalance} + ${mpSession.amountCents}`,
                lifetimeDeposited: sql`${userWallet.lifetimeDeposited} + ${mpSession.amountCents}`,
                updatedAt:         new Date(),
              })
              .where(eq(userWallet.userId, mpSession.userId)),
          ]);
        }
        if (mpSession.purpose === "coin_purchase" && mpSession.linkedTxId) {
          const meta       = mpSession.metadata ? JSON.parse(mpSession.metadata) : {};
          const totalCoins = Number(meta.totalCoins ?? 0);
          await Promise.all([
            db.update(walletTransactions)
              .set({ status: "completed", externalTxId: txHash ?? sessionId, updatedAt: new Date() })
              .where(eq(walletTransactions.id, mpSession.linkedTxId)),
            ...(totalCoins > 0 ? [
              db.update(userWallet)
                .set({
                  coinsBalance:        sql`${userWallet.coinsBalance} + ${totalCoins}`,
                  lifetimeCoinsEarned: sql`${userWallet.lifetimeCoinsEarned} + ${totalCoins}`,
                  lifetimeSpent:       sql`${userWallet.lifetimeSpent} + ${mpSession.amountCents}`,
                  updatedAt:           new Date(),
                })
                .where(eq(userWallet.userId, mpSession.userId)),
            ] : []),
          ]);
        }
        if (mpSession.purpose === "subscription" && mpSession.linkedSubId) {
          await db.update(subscriptions)
            .set({ paymentStatus: "completed", updatedAt: new Date() })
            .where(eq(subscriptions.id, mpSession.linkedSubId));
        }
        break;
      }

      default:
        console.log(`[maxelpay/webhook] Unhandled event type: ${event} — acking`);
    }

    return ack();

  } catch (e: any) {
    console.error("[maxelpay/webhook] ERROR:", e?.message ?? e);
    // Return 500 so MaxelPay retries delivery on processing errors
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}