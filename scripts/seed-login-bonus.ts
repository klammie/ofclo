/**
 * Run once to seed the 7-day login bonus config and streak milestones.
 *
 * Usage:
 *   npx tsx scripts/seed-login-bonus.ts
 *
 * IMPORTANT: set SEASON_ID below to your actual active season's id
 * (check with: SELECT id, name, status FROM fan_pass_seasons WHERE status = 'active';)
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" }); // fallback

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import {
  loginBonusDayConfig,
  loginStreakMilestone,
} from "../db/schema";

// ── SET THIS TO YOUR ACTUAL ACTIVE SEASON ID ──────────────────────────────────
const SEASON_ID = 16;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
        "Make sure your .env or .env.local file exists and has DATABASE_URL defined."
    );
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  console.log(`Seeding login bonus day config for season ${SEASON_ID}...`);

  // Reward types here match the REAL rewardTypeEnum:
  // "xp" | "coins" | "badge" | "exclusive_content" | "streak_freeze" | "mystery_box"
  await db.insert(loginBonusDayConfig).values([
    { seasonId: SEASON_ID, daySlot: 1, label: "Day 1", icon: "⚡", rewardType: "xp",                rewardAmount: 25,  rewardLabel: "+25 XP",            isSpecialDay: false },
    { seasonId: SEASON_ID, daySlot: 2, label: "Day 2", icon: "💰", rewardType: "coins",             rewardAmount: 50,  rewardLabel: "+50 Coins",          isSpecialDay: false },
    { seasonId: SEASON_ID, daySlot: 3, label: "Day 3", icon: "⚡", rewardType: "xp",                rewardAmount: 50,  rewardLabel: "+50 XP",            isSpecialDay: false },
    { seasonId: SEASON_ID, daySlot: 4, label: "Day 4", icon: "🌟", rewardType: "exclusive_content", rewardAmount: 1,   rewardLabel: "Exclusive Content",  isSpecialDay: false },
    { seasonId: SEASON_ID, daySlot: 5, label: "Day 5", icon: "⚡", rewardType: "xp",                rewardAmount: 75,  rewardLabel: "+75 XP",            isSpecialDay: false },
    { seasonId: SEASON_ID, daySlot: 6, label: "Day 6", icon: "📦", rewardType: "mystery_box",       rewardAmount: 1,   rewardLabel: "Mystery Box",        isSpecialDay: false },
    { seasonId: SEASON_ID, daySlot: 7, label: "Day 7", icon: "🏅", rewardType: "badge",             rewardAmount: 1,   rewardLabel: "Exclusive Badge",    isSpecialDay: true  },
  ]);

  console.log("Seeding streak milestones...");

  await db.insert(loginStreakMilestone).values([
    { seasonId: SEASON_ID, streakDays: 3,  title: "3-Day Streak",  icon: "🎁", rewardType: "coins",             rewardAmount: 200, rewardLabel: "+200 Coins"      },
    { seasonId: SEASON_ID, streakDays: 7,  title: "7-Day Streak",  icon: "💎", rewardType: "xp",                rewardAmount: 500, rewardLabel: "+500 XP"         },
    { seasonId: SEASON_ID, streakDays: 14, title: "14-Day Streak", icon: "👑", rewardType: "badge",             rewardAmount: 1,   rewardLabel: "Exclusive Badge" },
    { seasonId: SEASON_ID, streakDays: 30, title: "30-Day Streak", icon: "🌟", rewardType: "mystery_box",       rewardAmount: 1,   rewardLabel: "Mystery Box"     },
  ]);

  console.log("✅ Done! Seeded 7 day-configs + 4 streak milestones for season", SEASON_ID);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});