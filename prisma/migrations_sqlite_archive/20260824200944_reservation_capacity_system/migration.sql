/*
  Warnings:

  - Added the required column `dateKey` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ReservationSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxCovers" INTEGER,
    "maxBookings" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guests" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "dateKey" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Reservation" ("createdAt", "date", "dateKey", "email", "guests", "id", "name", "note", "phone", "status", "time", "updatedAt") SELECT "createdAt", "date", strftime('%Y-%m-%d', "date"), "email", "guests", "id", "name", "note", "phone", "status", "time", "updatedAt" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_dateKey_time_status_idx" ON "Reservation"("dateKey", "time", "status");
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "phone" TEXT NOT NULL DEFAULT '+90 242 000 00 00',
    "email" TEXT NOT NULL DEFAULT 'hello@ayla.restaurant',
    "addressLine1" TEXT NOT NULL DEFAULT 'Alanya,',
    "addressLine2" TEXT NOT NULL DEFAULT 'Antalya.',
    "country" TEXT NOT NULL DEFAULT 'Alanya · Türkiye',
    "mapUrl" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "instagramHandle" TEXT NOT NULL DEFAULT '@aylarestaurant',
    "googleReviewsUrl" TEXT NOT NULL DEFAULT '',
    "tripadvisorUrl" TEXT NOT NULL DEFAULT '',
    "privacyUrl" TEXT NOT NULL DEFAULT '',
    "kvkkUrl" TEXT NOT NULL DEFAULT '',
    "openTime" TEXT NOT NULL DEFAULT '18:00',
    "closeTime" TEXT NOT NULL DEFAULT '00:00',
    "maxGuests" INTEGER NOT NULL DEFAULT 12,
    "timeSlotInterval" INTEGER NOT NULL DEFAULT 30,
    "maxCoversPerSlot" INTEGER NOT NULL DEFAULT 24,
    "maxReservationsPerSlot" INTEGER NOT NULL DEFAULT 8,
    "heroImageUrl" TEXT NOT NULL DEFAULT '/hero_image.jpeg',
    "storyImageMain" TEXT NOT NULL DEFAULT '/story_main.jpeg',
    "storyImageDetail" TEXT NOT NULL DEFAULT '/story_detail.jpeg',
    "storyImageKitchen" TEXT NOT NULL DEFAULT '/kitchen.jpeg',
    "storyImageTable" TEXT NOT NULL DEFAULT '/table.jpeg',
    "storyImageAyla" TEXT NOT NULL DEFAULT '/ayla.jpeg',
    "reservationBgUrl" TEXT NOT NULL DEFAULT '/table.jpeg',
    "galleryImageDuration" INTEGER NOT NULL DEFAULT 5500,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("addressLine1", "addressLine2", "closeTime", "country", "email", "galleryImageDuration", "googleReviewsUrl", "heroImageUrl", "id", "instagramHandle", "instagramUrl", "kvkkUrl", "mapUrl", "maxGuests", "openTime", "phone", "privacyUrl", "reservationBgUrl", "storyImageAyla", "storyImageDetail", "storyImageKitchen", "storyImageMain", "storyImageTable", "timeSlotInterval", "tripadvisorUrl", "updatedAt") SELECT "addressLine1", "addressLine2", "closeTime", "country", "email", "galleryImageDuration", "googleReviewsUrl", "heroImageUrl", "id", "instagramHandle", "instagramUrl", "kvkkUrl", "mapUrl", "maxGuests", "openTime", "phone", "privacyUrl", "reservationBgUrl", "storyImageAyla", "storyImageDetail", "storyImageKitchen", "storyImageMain", "storyImageTable", "timeSlotInterval", "tripadvisorUrl", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSlot_time_key" ON "ReservationSlot"("time");

-- CreateIndex
CREATE INDEX "ReservationSlot_enabled_sortOrder_idx" ON "ReservationSlot"("enabled", "sortOrder");
