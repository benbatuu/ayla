-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "prepTimeMinutes" INTEGER;

-- CreateTable
CREATE TABLE "MenuFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT,
    "type" TEXT NOT NULL,
    "menuItemId" TEXT,
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WaiterCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'waiter',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaiterCall_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WaiterCall" ("createdAt", "id", "note", "status", "tableId", "updatedAt") SELECT "createdAt", "id", "note", "status", "tableId", "updatedAt" FROM "WaiterCall";
DROP TABLE "WaiterCall";
ALTER TABLE "new_WaiterCall" RENAME TO "WaiterCall";
CREATE INDEX "WaiterCall_status_createdAt_idx" ON "WaiterCall"("status", "createdAt");
CREATE INDEX "WaiterCall_tableId_idx" ON "WaiterCall"("tableId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MenuFeedback_type_createdAt_idx" ON "MenuFeedback"("type", "createdAt");
