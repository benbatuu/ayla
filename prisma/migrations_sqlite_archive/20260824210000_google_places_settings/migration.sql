-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "googlePlaceFeatureId" TEXT NOT NULL DEFAULT '0x14dc9983c30ef407:0xf396f6025729a5bb';
ALTER TABLE "SiteSettings" ADD COLUMN "googlePlaceId" TEXT NOT NULL DEFAULT '';
