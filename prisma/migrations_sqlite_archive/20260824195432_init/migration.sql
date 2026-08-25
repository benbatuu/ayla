-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiteSettings" (
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

-- CreateTable
CREATE TABLE "MessageBundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locale" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "price" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuItemTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "MenuItemTranslation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "poster" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GalleryItemTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "galleryItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    CONSTRAINT "GalleryItemTranslation_galleryItemId_fkey" FOREIGN KEY ("galleryItemId") REFERENCES "GalleryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guests" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MessageBundle_locale_key" ON "MessageBundle"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemTranslation_menuItemId_locale_key" ON "MenuItemTranslation"("menuItemId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryItemTranslation_galleryItemId_locale_key" ON "GalleryItemTranslation"("galleryItemId", "locale");
