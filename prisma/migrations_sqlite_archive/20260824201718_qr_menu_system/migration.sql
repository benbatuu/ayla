-- CreateTable
CREATE TABLE "MenuSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "wifiSsid" TEXT NOT NULL DEFAULT '',
    "wifiPassword" TEXT NOT NULL DEFAULT '',
    "welcomeMessageTr" TEXT NOT NULL DEFAULT 'Hoş geldiniz. Menünüze göz atın, garson çağırın veya sipariş verin.',
    "welcomeMessageEn" TEXT NOT NULL DEFAULT 'Welcome. Browse the menu, call a waiter, or place an order.',
    "menuLogoUrl" TEXT NOT NULL DEFAULT '/ayla_logo_rounded.png',
    "menuBaseUrl" TEXT NOT NULL DEFAULT 'http://menu.localhost:3000',
    "callWaiterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showImages" BOOLEAN NOT NULL DEFAULT true,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuCategoryTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "MenuCategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "label" TEXT,
    "zone" TEXT NOT NULL DEFAULT 'Salon',
    "qrToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WaiterCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaiterCall_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TableOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TableOrder_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TableOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "TableOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TableOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TableOrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "price" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "spicyLevel" INTEGER NOT NULL DEFAULT 0,
    "allergens" TEXT NOT NULL DEFAULT '',
    "calories" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MenuItem" ("createdAt", "id", "imageUrl", "price", "published", "sortOrder", "updatedAt") SELECT "createdAt", "id", "imageUrl", "price", "published", "sortOrder", "updatedAt" FROM "MenuItem";
DROP TABLE "MenuItem";
ALTER TABLE "new_MenuItem" RENAME TO "MenuItem";
CREATE INDEX "MenuItem_published_sortOrder_idx" ON "MenuItem"("published", "sortOrder");
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");
CREATE TABLE "new_MenuItemTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "MenuItemTranslation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MenuItemTranslation" ("category", "description", "id", "locale", "menuItemId", "name") SELECT "category", "description", "id", "locale", "menuItemId", "name" FROM "MenuItemTranslation";
DROP TABLE "MenuItemTranslation";
ALTER TABLE "new_MenuItemTranslation" RENAME TO "MenuItemTranslation";
CREATE UNIQUE INDEX "MenuItemTranslation_menuItemId_locale_key" ON "MenuItemTranslation"("menuItemId", "locale");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MenuCategory_published_sortOrder_idx" ON "MenuCategory"("published", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategoryTranslation_categoryId_locale_key" ON "MenuCategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_number_key" ON "RestaurantTable"("number");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_qrToken_key" ON "RestaurantTable"("qrToken");

-- CreateIndex
CREATE INDEX "RestaurantTable_active_idx" ON "RestaurantTable"("active");

-- CreateIndex
CREATE INDEX "WaiterCall_status_createdAt_idx" ON "WaiterCall"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WaiterCall_tableId_idx" ON "WaiterCall"("tableId");

-- CreateIndex
CREATE INDEX "TableOrder_status_createdAt_idx" ON "TableOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TableOrder_tableId_idx" ON "TableOrder"("tableId");
