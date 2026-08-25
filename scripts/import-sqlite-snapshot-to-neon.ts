/**
 * Import media/sqlite-snapshot.json into the current DATABASE_URL (Neon).
 * Run after: prisma db push && prisma generate
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

type Snapshot = {
  users: Array<Record<string, unknown>>;
  siteSettings: Array<Record<string, unknown>>;
  menuSettings: Array<Record<string, unknown>>;
  messageBundles: Array<Record<string, unknown>>;
  menuCategories: Array<Record<string, unknown>>;
  menuCategoryTranslations: Array<Record<string, unknown>>;
  menuItems: Array<Record<string, unknown>>;
  menuItemTranslations: Array<Record<string, unknown>>;
  restaurantTables: Array<Record<string, unknown>>;
  waiterCalls: Array<Record<string, unknown>>;
  menuFeedback: Array<Record<string, unknown>>;
  tableOrders: Array<Record<string, unknown>>;
  tableOrderItems: Array<Record<string, unknown>>;
  galleryItems: Array<Record<string, unknown>>;
  galleryItemTranslations: Array<Record<string, unknown>>;
  reservations: Array<Record<string, unknown>>;
  reservationSlots: Array<Record<string, unknown>>;
  mediaAssets: Array<Record<string, unknown>>;
  seoSettings: Array<Record<string, unknown>>;
  marketingSettings: Array<Record<string, unknown>>;
  marketingCampaigns: Array<Record<string, unknown>>;
  pageViews: Array<Record<string, unknown>>;
};

function reviveDates<T extends Record<string, unknown>>(
  row: T,
  keys: string[]
): T {
  const next = { ...row };
  for (const key of keys) {
    if (typeof next[key] === "string") {
      next[key] = new Date(next[key] as string);
    }
  }
  return next;
}

async function main() {
  const file = path.join(process.cwd(), "media", "sqlite-snapshot.json");
  const snapshot = JSON.parse(fs.readFileSync(file, "utf8")) as Snapshot;

  console.log("Importing into", process.env.DATABASE_URL?.split("@")[1]?.slice(0, 40));

  // Order matters for FKs
  for (const row of snapshot.users) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.user.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.siteSettings) {
    const data = reviveDates(row, ["updatedAt"]);
    await prisma.siteSettings.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.menuSettings) {
    const data = reviveDates(row, ["updatedAt"]);
    await prisma.menuSettings.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.seoSettings) {
    const data = reviveDates(row, ["updatedAt"]);
    await prisma.seoSettings.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.marketingSettings) {
    const data = reviveDates(row, ["updatedAt"]);
    await prisma.marketingSettings.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.messageBundles) {
    const data = reviveDates(row, ["updatedAt"]);
    await prisma.messageBundle.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  // Categories: parents first (null parentId), then children
  const cats = [...snapshot.menuCategories].sort((a, b) => {
    const ap = a.parentId ? 1 : 0;
    const bp = b.parentId ? 1 : 0;
    return ap - bp;
  });
  for (const row of cats) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.menuCategory.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.menuCategoryTranslations) {
    await prisma.menuCategoryTranslation.upsert({
      where: { id: row.id as string },
      create: row as never,
      update: row as never,
    });
  }

  for (const row of snapshot.menuItems) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.menuItem.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.menuItemTranslations) {
    await prisma.menuItemTranslation.upsert({
      where: { id: row.id as string },
      create: row as never,
      update: row as never,
    });
  }

  for (const row of snapshot.restaurantTables) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.restaurantTable.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.reservationSlots) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.reservationSlot.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.reservations) {
    const data = reviveDates(row, ["date", "createdAt", "updatedAt"]);
    await prisma.reservation.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.galleryItems) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.galleryItem.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.galleryItemTranslations) {
    await prisma.galleryItemTranslation.upsert({
      where: { id: row.id as string },
      create: row as never,
      update: row as never,
    });
  }

  for (const row of snapshot.mediaAssets) {
    const data = reviveDates(row, ["createdAt"]);
    await prisma.mediaAsset.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.marketingCampaigns) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.marketingCampaign.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.tableOrders) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.tableOrder.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.tableOrderItems) {
    await prisma.tableOrderItem.upsert({
      where: { id: row.id as string },
      create: row as never,
      update: row as never,
    });
  }

  for (const row of snapshot.waiterCalls) {
    const data = reviveDates(row, ["createdAt", "updatedAt"]);
    await prisma.waiterCall.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  for (const row of snapshot.menuFeedback) {
    const data = reviveDates(row, ["createdAt"]);
    await prisma.menuFeedback.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  // Page views can be large — import in chunks, skip if empty
  const views = snapshot.pageViews ?? [];
  const chunk = 100;
  for (let i = 0; i < views.length; i += chunk) {
    const slice = views.slice(i, i + chunk).map((row) =>
      reviveDates(row, ["createdAt"])
    );
    await prisma.pageView.createMany({
      data: slice as never,
      skipDuplicates: true,
    });
    if (i % 500 === 0) console.log("pageViews", i, "/", views.length);
  }

  console.log("Import complete.");
  console.log({
    users: await prisma.user.count(),
    menuItems: await prisma.menuItem.count(),
    categories: await prisma.menuCategory.count(),
    tables: await prisma.restaurantTable.count(),
    slots: await prisma.reservationSlot.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
