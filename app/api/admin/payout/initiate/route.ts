// app/api/admin/payouts/initiate/route.ts
// Initiates a single payout to a creator's wallet via MaxelPay

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators, user, payouts, creatorWallets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { initiatePayout, generateOrderId } from "@/lib/maxelpay";

const PLATFORM_FEE_RATE = 0.20; // 20%

export async function POST(req: NextRequest) {
  // BetterAuth role check — admin only
  const { session, error } = await assertRole(req, "admin");
  if (error) return error;

  const { creatorId } = await req.json() as { creatorId: string };

  // Fetch creator with pending payout balance
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const pendingAmount = Number(creator.pendingPayout);
  
  // Minimum payout threshold
  if (pendingAmount < 10) {
    return NextResponse.json(
      { error: "Minimum payout is $10. Current balance: $" + pendingAmount.toFixed(2) },
      { status: 400 }
    );
  }

  // Get creator's default payout wallet
  const [wallet] = await db
    .select()
    .from(creatorWallets)
    .where(
      and(
        eq(creatorWallets.creatorId, creatorId),
        eq(creatorWallets.isDefault, true)
      )
    )
    .limit(1);

  if (!wallet) {
    return NextResponse.json(
      { error: "Creator has not configured a payout wallet" },
      { status: 400 }
    );
  }

  // Get creator user details (BetterAuth user table)
  const [creatorUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, creator.userId))
    .limit(1);

  if (!creatorUser) {
    return NextResponse.json({ error: "Creator user not found" }, { status: 404 });
  }

  // Calculate platform fee and net payout
  const grossAmount = pendingAmount;
  const platformFee = Number((grossAmount * PLATFORM_FEE_RATE).toFixed(2));
  const netAmount = Number((grossAmount - platformFee).toFixed(2));

  const payoutId = generateOrderId("payout", creatorId);

  // Insert payout record
  const [payoutRecord] = await db
    .insert(payouts)
    .values({
      creatorId,
      grossAmount: grossAmount.toFixed(2),
      platformFee: platformFee.toFixed(2),
      netAmount: netAmount.toFixed(2),
      status: "processing",
      cryptoCurrency: wallet.currency,
      destinationAddress: wallet.address,
    })
    .returning();

  try {
    // Initiate MaxelPay crypto payout
    const result = await initiatePayout({
      payoutId: payoutRecord.id,
      amountUsd: netAmount,
      destinationAddress: wallet.address,
      currency: wallet.currency,
      network: wallet.network,
      creatorEmail: creatorUser.email,
      creatorName: creatorUser.name,
    });

    // Update payout record with MaxelPay transfer ID
    await db
      .update(payouts)
      .set({ maxelpayTransferId: result.transferId, updatedAt: new Date() })
      .where(eq(payouts.id, payoutRecord.id));

    return NextResponse.json({
      success: true,
      transferId: result.transferId,
      netAmount: netAmount.toFixed(2),
      cryptoCurrency: wallet.currency,
      network: wallet.network,
    });

  } catch (err) {
    // Roll back payout to failed state
    await db
      .update(payouts)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payouts.id, payoutRecord.id));

    console.error("[MaxelPay] Payout initiation failed:", err);
    
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : "Payout failed. Please try again.",
      },
      { status: 502 }
    );
  }
}