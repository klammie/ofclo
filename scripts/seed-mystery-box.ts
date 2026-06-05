import "dotenv/config";
import { seedMysteryBoxShopItems, seedAllRewardItems } from "../lib/mystery-box.service";

async function main() {
  console.log("Seeding mystery box shop items…");
  await seedMysteryBoxShopItems();

  console.log("Seeding all reward items into shop_items…");
  await seedAllRewardItems();

  console.log("Done ✓");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });