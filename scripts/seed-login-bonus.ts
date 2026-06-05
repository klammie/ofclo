// scripts/seed-login-bonus.ts
import "dotenv/config";  // ← add this as the very first line

import { db } from "../db";
import { seedDefaultDayConfig } from "../lib/login-bonus.service";

async function main() {
  console.log("Seeding login bonus config for season 1…");
  await seedDefaultDayConfig(1);
  console.log("Done ✓");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});