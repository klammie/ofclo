// app/api/admin/payouts/batch/route.ts
// Processes all pending payouts in a batch operation

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators, user, payouts, creatorWallets } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { initiatePayout, generateOrderId } from "@/lib/maxelpay";

const PLATFORM_FEE_RATE = 0.20;
const MIN_PAYOUT = 10;

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "admin");
  if (error) return error;

  // Find all creators with pending payout >= $10
  const eligibleCreators = await db
    .select()
    .from(creators)
    .where(gte(creators.pendingPayout, MIN_PAYOUT.toString()));

  if (eligibleCreators.length === 0) {
    return NextResponse.json({ 
      message: "No creators eligible for payout (minimum $10)",
      processed: 0,
    });
  }

  let processed = 0;
  let failed = 0;
  const results: Array<{
    creatorId: string;
    creatorName: string;
    status: "success" | "failed";
    error?: string;
  }> = [];

  for (const creator of eligibleCreators) {
    try {
      // Get wallet
      const [wallet] = await db
        .select()
        .from(creatorWallets)
        .where(
          and(
            eq(creatorWallets.creatorId, creator.id),
            eq(creatorWallets.isDefault, true)
          )
        )
        .limit(1);

      if (!wallet) {
        results.push({
          creatorId: creator.id,
          creatorName: "Unknown",
          status: "failed",
          error: "No wallet configured",
        });
        failed++;
        continue;
      }

      // Get user details
      const [creatorUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, creator.userId))
        .limit(1);

      if (!creatorUser) {
        results.push({
          creatorId: creator.id,
          creatorName: "Unknown",
          status: "failed",
          error: "User not found",
        });
        failed++;
        continue;
      }

      const grossAmount = Number(creator.pendingPayout);
      const platformFee = Number((grossAmount * PLATFORM_FEE_RATE).toFixed(2));
      const netAmount = Number((grossAmount - platformFee).toFixed(2));

      const payoutId = generateOrderId("payout", creator.id);

      // Insert payout record
      const [payoutRecord] = await db
        .insert(payouts)
        .values({
          creatorId: creator.id,
          grossAmount: grossAmount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          netAmount: netAmount.toFixed(2),
          status: "processing",
          cryptoCurrency: wallet.currency,
          destinationAddress: wallet.address,
        })
        .returning();

      // Initiate MaxelPay payout
      const result = await initiatePayout({
        payoutId: payoutRecord.id,
        amountUsd: netAmount,
        destinationAddress: wallet.address,
        currency: wallet.currency,
        network: wallet.network,
        creatorEmail: creatorUser.email,
        creatorName: creatorUser.name,
      });

      await db
        .update(payouts)
        .set({ maxelpayTransferId: result.transferId, updatedAt: new Date() })
        .where(eq(payouts.id, payoutRecord.id));

      results.push({
        creatorId: creator.id,
        creatorName: creatorUser.name,
        status: "success",
      });
      processed++;

    } catch (err) {
      console.error(`[Batch Payout] Failed for creator ${creator.id}:`, err);
      
      results.push({
        creatorId: creator.id,
        creatorName: "Unknown",
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
      failed++;
    }
  }

  return NextResponse.json({
    total: eligibleCreators.length,
    processed,
    failed,
    results,
  });
}