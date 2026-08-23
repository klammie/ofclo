// scripts/seed-season-tasks.ts
// Run with: npx tsx scripts/seed-season-tasks.ts
import { db } from "@/db";
import { seasonTasks } from "@/db/schema";

const SEASON_ID = 1; // change to your active season id

const tasks = [
  // ── Engagement ────────────────────────────────────────────────────────────
  { title: "Like 3 posts",          icon: "❤️",  xpReward: 30,  coinReward: 5,  tier: "free",    sortOrder: 0  },
  { title: "Like 5 posts",          icon: "❤️",  xpReward: 50,  coinReward: 8,  tier: "free",    sortOrder: 1  },
  { title: "Leave a comment",       icon: "💬",  xpReward: 40,  coinReward: 8,  tier: "free",    sortOrder: 2  },
  { title: "Leave 3 comments",      icon: "💬",  xpReward: 70,  coinReward: 12, tier: "free",    sortOrder: 3  },
  { title: "Bookmark a post",       icon: "🔖",  xpReward: 20,  coinReward: 5,  tier: "free",    sortOrder: 4  },
  { title: "Bookmark 3 posts",      icon: "🔖",  xpReward: 40,  coinReward: 8,  tier: "free",    sortOrder: 5  },
  { title: "View 5 posts",          icon: "👀",  xpReward: 25,  coinReward: 5,  tier: "free",    sortOrder: 6  },
  { title: "View 10 posts",         icon: "👀",  xpReward: 45,  coinReward: 8,  tier: "free",    sortOrder: 7  },
  // ── Social ────────────────────────────────────────────────────────────────
  { title: "Send a gift",           icon: "🎁",  xpReward: 60,  coinReward: 10, tier: "free",    sortOrder: 8  },
  { title: "Subscribe to a creator",icon: "⭐",  xpReward: 80,  coinReward: 15, tier: "free",    sortOrder: 9  },
  { title: "Send a message",        icon: "💌",  xpReward: 30,  coinReward: 5,  tier: "free",    sortOrder: 10 },
  { title: "Visit a creator profile",icon: "🔍", xpReward: 20,  coinReward: 3,  tier: "free",    sortOrder: 11 },
  // ── Shop ──────────────────────────────────────────────────────────────────
  { title: "Purchase an item",      icon: "🛍️",  xpReward: 50,  coinReward: 0,  tier: "free",    sortOrder: 12 },
  { title: "Open a mystery box",    icon: "📦",  xpReward: 60,  coinReward: 0,  tier: "free",    sortOrder: 13 },
  // ── Login / streak ────────────────────────────────────────────────────────
  { title: "Daily login",           icon: "📅",  xpReward: 20,  coinReward: 5,  tier: "free",    sortOrder: 14 },
  { title: "Maintain a 3-day streak",icon: "🔥", xpReward: 75,  coinReward: 15, tier: "free",    sortOrder: 15 },
  // ── VIP / premium ─────────────────────────────────────────────────────────
  { title: "VIP Daily Login",       icon: "💎",  xpReward: 120, coinReward: 25, tier: "premium", sortOrder: 16 },
  { title: "Like 10 posts",         icon: "❤️",  xpReward: 100, coinReward: 20, tier: "premium", sortOrder: 17 },
  { title: "Leave 5 comments",      icon: "💬",  xpReward: 120, coinReward: 20, tier: "premium", sortOrder: 18 },
  { title: "Send 3 gifts",          icon: "🎁",  xpReward: 150, coinReward: 25, tier: "premium", sortOrder: 19 },
];

async function seed() {
  console.log(`Seeding ${tasks.length} tasks for season ${SEASON_ID}...`);
  for (const task of tasks) {
    await db.insert(seasonTasks).values({
      seasonId:    SEASON_ID,
      title:       task.title,
      description: "",
      icon:        task.icon,
      xpReward:    task.xpReward,
      coinReward:  task.coinReward,
      tier:        task.tier as any,
      type:        "weekly" as any,
      isActive:    true,
      sortOrder:   task.sortOrder,
    }).onConflictDoNothing();
  }
  console.log("Done.");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });