import { db } from "@/db";
import {
  userWallet,
  walletTransactions,
  coinPackages,
  cryptoInvoices,
} from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type {
  WalletBalance,
  Transactions,
  CoinPackage,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  WithdrawResponse,
  BuyCoinsRequest,
  BuyCoinsResponse,
} from "@/lib/types";

// ─── Platform fee (%) ─────────────────────────────────────────────────────────
const PLATFORM_FEE_PCT = 20;
const WITHDRAW_MIN_CENTS = 2000; // $20 minimum withdrawal

// ─── Get or create wallet ─────────────────────────────────────────────────────

export async function getOrCreateWallet(userId: string) {
  const existing = await db.query.userWallet.findFirst({
    where: eq(userWallet.userId, userId),
  });
  if (existing) return existing;

  await db.insert(userWallet).values({ userId }).onConflictDoNothing();
  return await db.query.userWallet.findFirst({
    where: eq(userWallet.userId, userId),
  });
}

// ─── Get wallet balance ───────────────────────────────────────────────────────

export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) throw new Error("SERVER_ERROR");

  return {
    usdBalance:        wallet.usdBalance,
    coinsBalance:      wallet.coinsBalance,
    pendingBalance:    wallet.pendingBalance,
    lifetimeDeposited: wallet.lifetimeDeposited,
    lifetimeSpent:     wallet.lifetimeSpent,
    lifetimeEarned:    wallet.lifetimeEarned,
    lifetimeWithdrawn: wallet.lifetimeWithdrawn,
  };
}

// ─── Get transaction history ──────────────────────────────────────────────────

export async function getTransactions(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Transactions[]> {
  const rows = await db.query.walletTransactions.findMany({
    where: eq(walletTransactions.userId, userId),
    orderBy: [desc(walletTransactions.createdAt)],
    limit,
    offset,
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type as any,
    status: r.status as any,
    currency: r.currency as any,
    amountCents: r.amountCents,
    coinsAmount: r.coinsAmount,
    description: r.description,
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ─── Get coin packages ────────────────────────────────────────────────────────

export async function getCoinPackages(): Promise<CoinPackage[]> {
  const rows = await db.query.coinPackages.findMany({
    where: eq(coinPackages.isActive, true),
    orderBy: (t, { asc }) => [asc(t.sortOrder)],
  });

  return rows.map((r) => ({
    id: r.id,
    coins: r.coins,
    priceCents: r.priceCents,
    bonusCoins: r.bonusCoins,
    totalCoins: r.coins + r.bonusCoins,
    isBestValue: r.isBestValue,
    isMostPopular: r.isMostPopular,
    cryptoEnabled: r.cryptoEnabled,
  }));
}

// ─── Initiate deposit (card → Maxelpay, crypto → invoice) ────────────────────

export async function initiateDeposit(
  userId: string,
  req: DepositRequest
): Promise<DepositResponse> {
  if (req.amountCents < 100) throw new Error("INVALID_AMOUNT"); // min $1

  const txId = randomUUID();

  // Create pending transaction
  await db.insert(walletTransactions).values({
    id: txId,
    userId,
    type: req.method === "crypto" ? "crypto_deposit" : "deposit",
    status: "pending",
    currency: req.method === "crypto" ? "crypto" : "usd",
    amountCents: req.amountCents,
    coinsAmount: 0,
    description: `Deposit $${(req.amountCents / 100).toFixed(2)} via ${req.method}`,
    externalTxId: null,
  });

  if (req.method === "card") {
    // ── Maxelpay integration (wire this up later) ──────────────────────────
    // const checkout = await maxelpay.createCheckout({
    //   amount: req.amountCents,
    //   currency: "USD",
    //   orderId: txId,
    //   returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/wallet?deposit=success`,
    //   cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/wallet?deposit=cancelled`,
    //   metadata: { userId, txId },
    // });
    // return { success: true, transactionId: txId, checkoutUrl: checkout.url };

    return {
      success: true,
      transactionId: txId,
      checkoutUrl: `/dashboard/user/wallet?deposit=pending&txId=${txId}`,
      // ↑ Replace with real Maxelpay checkout URL when ready
    };
  }

  // ── Crypto deposit ─────────────────────────────────────────────────────────
  const cryptoCurrency = req.cryptoCurrency ?? "USDT";
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  // Mock crypto rate conversion (replace with real rate API)
  const mockRates: Record<string, number> = {
    BTC:  0.0000165,
    ETH:  0.000526,
    USDT: 1.0,
    USDC: 1.0,
    LTC:  0.0128,
  };
  const rate = mockRates[cryptoCurrency] ?? 1;
  const cryptoAmount = (req.amountCents / 100 * rate).toFixed(6);

  // Mock wallet address (replace with your crypto payment provider)
  const mockAddresses: Record<string, string> = {
    BTC:  "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ETH:  "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    USDT: "TKFiMkbSqvqnJBV2uJTmkVFMiPQjhKFwXg",
    USDC: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    LTC:  "LVsMhpYq31RXKzBFNgGdCTjR9AvJDJCBr5",
  };
  const walletAddress = mockAddresses[cryptoCurrency] ?? mockAddresses.USDT;

  // Create crypto invoice
  const invoiceId = randomUUID();
  await db.insert(cryptoInvoices).values({
    id: invoiceId,
    userId,
    transactionId: txId,
    cryptoCurrency,
    cryptoAmount,
    walletAddress,
    usdAmountCents: req.amountCents,
    status: "pending",
    expiresAt,
  });

  return {
    success: true,
    transactionId: txId,
    cryptoAddress: walletAddress,
    cryptoAmount,
    cryptoCurrency,
    expiresAt: expiresAt.toISOString(),
  };
}

// ─── Complete deposit (called by webhook) ────────────────────────────────────

export async function completeDeposit(
  transactionId: string,
  externalTxId: string
): Promise<void> {
  const tx = await db.query.walletTransactions.findFirst({
    where: eq(walletTransactions.id, transactionId),
  });
  if (!tx || tx.status !== "pending") return;

  await Promise.all([
    db.update(walletTransactions)
      .set({ status: "completed", externalTxId, updatedAt: new Date() })
      .where(eq(walletTransactions.id, transactionId)),

    db.update(userWallet)
      .set({
        usdBalance: sql`${userWallet.usdBalance} + ${tx.amountCents}`,
        lifetimeDeposited: sql`${userWallet.lifetimeDeposited} + ${tx.amountCents}`,
        updatedAt: new Date(),
      })
      .where(eq(userWallet.userId, tx.userId)),
  ]);
}

// ─── Withdraw ─────────────────────────────────────────────────────────────────

export async function initiateWithdrawal(
  userId: string,
  req: WithdrawRequest
): Promise<WithdrawResponse> {
  if (req.amountCents < WITHDRAW_MIN_CENTS) throw new Error("BELOW_MINIMUM");

  const wallet = await getOrCreateWallet(userId);
  if (!wallet) throw new Error("SERVER_ERROR");
  if (wallet.usdBalance < req.amountCents) throw new Error("INSUFFICIENT_FUNDS");

  const txId = randomUUID();

  await Promise.all([
    db.insert(walletTransactions).values({
      id: txId,
      userId,
      type: "withdrawal",
      status: "pending",
      currency: "usd",
      amountCents: req.amountCents,
      coinsAmount: 0,
      description: `Withdrawal $${(req.amountCents / 100).toFixed(2)} via ${req.method}`,
      metadata: JSON.stringify(
        req.method === "bank"
          ? { accountName: req.bankDetails?.accountName, last4: req.bankDetails?.accountNumber?.slice(-4) }
          : { cryptoCurrency: req.cryptoCurrency, cryptoAddress: req.cryptoAddress }
      ),
    }),

    // Hold the funds (deduct from available, but don't mark as withdrawn until processed)
    db.update(userWallet)
      .set({
        usdBalance: sql`${userWallet.usdBalance} - ${req.amountCents}`,
        updatedAt: new Date(),
      })
      .where(eq(userWallet.userId, userId)),
  ]);

  return {
    success: true,
    transactionId: txId,
    estimatedArrival: req.method === "bank" ? "3–5 business days" : "10–30 minutes",
    message: `Your withdrawal of $${(req.amountCents / 100).toFixed(2)} is being processed.`,
  };
}

// ─── Buy coins with USD balance ───────────────────────────────────────────────

export async function buyCoins(
  userId: string,
  req: BuyCoinsRequest
): Promise<BuyCoinsResponse> {
  const pkg = await db.query.coinPackages.findFirst({
    where: and(eq(coinPackages.id, req.packageId), eq(coinPackages.isActive, true)),
  });
  if (!pkg) throw new Error("INVALID_AMOUNT");

  const totalCoins = pkg.coins + pkg.bonusCoins;

  if (req.method === "usd_balance") {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) throw new Error("SERVER_ERROR");
    if (wallet.usdBalance < pkg.priceCents) throw new Error("INSUFFICIENT_FUNDS");

    const txId = randomUUID();

    await Promise.all([
      // Deduct USD
      db.update(userWallet)
        .set({
          usdBalance: sql`${userWallet.usdBalance} - ${pkg.priceCents}`,
          coinsBalance: sql`${userWallet.coinsBalance} + ${totalCoins}`,
          lifetimeSpent: sql`${userWallet.lifetimeSpent} + ${pkg.priceCents}`,
          lifetimeCoinsEarned: sql`${userWallet.lifetimeCoinsEarned} + ${totalCoins}`,
          updatedAt: new Date(),
        })
        .where(eq(userWallet.userId, userId)),

      // Log spend
      db.insert(walletTransactions).values({
        id: txId,
        userId,
        type: "coin_purchase",
        status: "completed",
        currency: "coins",
        amountCents: pkg.priceCents,
        coinsAmount: totalCoins,
        description: `Purchased ${totalCoins.toLocaleString()} coins${pkg.bonusCoins > 0 ? ` (+${pkg.bonusCoins} bonus)` : ""}`,
      }),
    ]);

    const updated = await getOrCreateWallet(userId);

    return {
      success: true,
      coinsAdded: totalCoins,
      newCoinBalance: updated?.coinsBalance ?? 0,
      newUsdBalance: updated?.usdBalance ?? 0,
      transactionId: txId,
    };
  }

  // card / crypto — initiate payment flow same as deposit
  const depositResult = await initiateDeposit(userId, {
    amountCents: pkg.priceCents,
    method: req.method === "card" ? "card" : "crypto",
    cryptoCurrency: req.cryptoCurrency as any,
  });

  return {
    success: true,
    coinsAdded: 0, // coins credited after payment completes via webhook
    newCoinBalance: 0,
    newUsdBalance: 0,
    transactionId: depositResult.transactionId,
    checkoutUrl: depositResult.checkoutUrl,
    cryptoAddress: depositResult.cryptoAddress,
    cryptoAmount: depositResult.cryptoAmount,
    cryptoCurrency: depositResult.cryptoCurrency,
    expiresAt: depositResult.expiresAt,
  };
}

// ─── Seed default coin packages ───────────────────────────────────────────────

export async function seedCoinPackages() {
  const packages = [
    { id: "coins_100",   coins: 100,   priceCents: 99,   bonusCoins: 0,    isBestValue: false, isMostPopular: false, sortOrder: 0 },
    { id: "coins_500",   coins: 500,   priceCents: 399,  bonusCoins: 50,   isBestValue: false, isMostPopular: true,  sortOrder: 1 },
    { id: "coins_1200",  coins: 1200,  priceCents: 799,  bonusCoins: 200,  isBestValue: false, isMostPopular: false, sortOrder: 2 },
    { id: "coins_2500",  coins: 2500,  priceCents: 1499, bonusCoins: 500,  isBestValue: false, isMostPopular: false, sortOrder: 3 },
    { id: "coins_5000",  coins: 5000,  priceCents: 2499, bonusCoins: 1000, isBestValue: true,  isMostPopular: false, sortOrder: 4 },
    { id: "coins_12000", coins: 12000, priceCents: 4999, bonusCoins: 3000, isBestValue: false, isMostPopular: false, sortOrder: 5 },
  ];

  await db.insert(coinPackages).values(packages).onConflictDoNothing();
  console.log(`Seeded ${packages.length} coin packages ✓`);
}