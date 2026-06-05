import "dotenv/config";
import { seedCoinPackages } from "../lib/wallet.service";

async function main() {
  console.log("Seeding coin packages…");
  await seedCoinPackages();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });