-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "externalId" INTEGER,
    "hasSubcategories" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MenuCategory" ("createdAt", "id", "published", "sortOrder", "updatedAt") SELECT "createdAt", "id", "published", "sortOrder", "updatedAt" FROM "MenuCategory";
DROP TABLE "MenuCategory";
ALTER TABLE "new_MenuCategory" RENAME TO "MenuCategory";
CREATE UNIQUE INDEX "MenuCategory_slug_key" ON "MenuCategory"("slug");
CREATE UNIQUE INDEX "MenuCategory_externalId_key" ON "MenuCategory"("externalId");
CREATE INDEX "MenuCategory_published_sortOrder_idx" ON "MenuCategory"("published", "sortOrder");
CREATE INDEX "MenuCategory_parentId_idx" ON "MenuCategory"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
