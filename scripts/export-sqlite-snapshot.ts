/**
 * One-shot: export current SQLite DB to JSON while schema is still sqlite.
 * Usage: DATABASE_URL="file:./dev.db" npx tsx scripts/export-sqlite-snapshot.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";

const sqliteUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const prisma = new PrismaClient({
  datasources: { db: { url: sqliteUrl } },
});

async function main() {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    users: await prisma.user.findMany(),
    siteSettings: await prisma.siteSettings.findMany(),
    menuSettings: await prisma.menuSettings.findMany(),
    messageBundles: await prisma.messageBundle.findMany(),
    menuCategories: await prisma.menuCategory.findMany(),
    menuCategoryTranslations: await prisma.menuCategoryTranslation.findMany(),
    menuItems: await prisma.menuItem.findMany(),
    menuItemTranslations: await prisma.menuItemTranslation.findMany(),
    restaurantTables: await prisma.restaurantTable.findMany(),
    waiterCalls: await prisma.waiterCall.findMany(),
    menuFeedback: await prisma.menuFeedback.findMany(),
    tableOrders: await prisma.tableOrder.findMany(),
    tableOrderItems: await prisma.tableOrderItem.findMany(),
    galleryItems: await prisma.galleryItem.findMany(),
    galleryItemTranslations: await prisma.galleryItemTranslation.findMany(),
    reservations: await prisma.reservation.findMany(),
    reservationSlots: await prisma.reservationSlot.findMany(),
    mediaAssets: await prisma.mediaAsset.findMany(),
    seoSettings: await prisma.seoSettings.findMany(),
    marketingSettings: await prisma.marketingSettings.findMany(),
    marketingCampaigns: await prisma.marketingCampaign.findMany(),
    pageViews: await prisma.pageView.findMany(),
  };

  const out = path.join(process.cwd(), "media", "sqlite-snapshot.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(snapshot));
  console.log("Exported to", out);
  console.log(
    "counts",
    Object.fromEntries(
      Object.entries(snapshot)
        .filter(([, v]) => Array.isArray(v))
        .map(([k, v]) => [k, (v as unknown[]).length])
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
