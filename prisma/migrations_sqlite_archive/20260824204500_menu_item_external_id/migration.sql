-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "slug" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN "externalId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_slug_key" ON "MenuItem"("slug");
CREATE UNIQUE INDEX "MenuItem_externalId_key" ON "MenuItem"("externalId");
