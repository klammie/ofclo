/**
 * Run once to seed all default shop items.
 *
 *   npx tsx --env-file=.env.local scripts/seed-shop.ts
 */
import "dotenv/config";
import { seedShopItems } from "../lib/shop.service";

async function main() {
  console.log("Seeding shop items…");
  await seedShopItems();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });