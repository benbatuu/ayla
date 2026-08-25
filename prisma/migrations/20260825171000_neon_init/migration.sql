Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "businessName" TEXT NOT NULL DEFAULT 'Ay''la Food & More',
    "phone" TEXT NOT NULL DEFAULT '+90 549 613 53 73',
    "phoneSecondary" TEXT NOT NULL DEFAULT '+90 242 502 71 70',
    "email" TEXT NOT NULL DEFAULT 'reservation@aylaalanya.com',
    "addressLine1" TEXT NOT NULL DEFAULT 'Kadıpaşa, Sugözü Cd. No:10',
    "addressLine2" TEXT NOT NULL DEFAULT '07400 Alanya / Antalya',
    "country" TEXT NOT NULL DEFAULT 'Türkiye',
    "postalCode" TEXT NOT NULL DEFAULT '07400',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 36.5484256,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 31.9945747,
    "mapUrl" TEXT NOT NULL DEFAULT '',
    "googlePlaceFeatureId" TEXT NOT NULL DEFAULT '0x14dc9983c30ef407:0xf396f6025729a5bb',
    "googlePlaceId" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "instagramHandle" TEXT NOT NULL DEFAULT '@ayla_alanya',
    "facebookUrl" TEXT NOT NULL DEFAULT '',
    "whatsappUrl" TEXT NOT NULL DEFAULT 'https://wa.me/905496135373',
    "googleReviewsUrl" TEXT NOT NULL DEFAULT '',
    "tripadvisorUrl" TEXT NOT NULL DEFAULT '',
    "privacyUrl" TEXT NOT NULL DEFAULT '',
    "kvkkUrl" TEXT NOT NULL DEFAULT '',
    "directionsNoteTr" TEXT NOT NULL DEFAULT 'Kadıpaşa Mahallesi, Sugözü Cd. No:10. Alanya merkez / Kleopatra tarafına yakın. Taksi ve araçla kolay ulaşım; sokak üzeri park imkânı sınırlıdır — yakındaki otoparkları tercih edebilirsiniz.',
    "directionsNoteEn" TEXT NOT NULL DEFAULT 'Kadıpaşa, Sugözü Cd. No:10. Near central Alanya / Kleopatra area. Easy by taxi or car; street parking is limited — nearby lots are recommended.',
    "directionsNoteRu" TEXT NOT NULL DEFAULT 'Kadıpaşa, Sugözü Cd. No:10. Рядом с центром Аланьи / Клеопатрой. Удобно на такси или машине; уличная парковка ограничена — рекомендуем ближайшие стоянки.',
    "openTime" TEXT NOT NULL DEFAULT '10:00',
    "closeTime" TEXT NOT NULL DEFAULT '01:00',
    "maxGuests" INTEGER NOT NULL DEFAULT 12,
    "largePartyPhoneThreshold" INTEGER NOT NULL DEFAULT 8,
    "maxReservationDaysAhead" INTEGER NOT NULL DEFAULT 7,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "wifiSsid" TEXT NOT NULL DEFAULT '',
    "wifiPassword" TEXT NOT NULL DEFAULT '',
    "welcomeMessageTr" TEXT NOT NULL DEFAULT 'Hoş geldiniz. Menünüze göz atın, garson çağırın veya sipariş verin.',
    "welcomeMessageEn" TEXT NOT NULL DEFAULT 'Welcome. Browse the menu, call a waiter, or place an order.',
    "welcomeMessageRu" TEXT NOT NULL DEFAULT 'Добро пожаловать. Просмотрите меню, позовите официанта или сделайте заказ.',
    "menuLogoUrl" TEXT NOT NULL DEFAULT '/ayla_logo_rounded.png',
    "menuBaseUrl" TEXT NOT NULL DEFAULT 'http://menu.localhost:3000',
    "callWaiterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showImages" BOOLEAN NOT NULL DEFAULT true,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageBundle" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "externalId" INTEGER,
    "hasSubcategories" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MenuCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "externalId" INTEGER,
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
    "prepTimeMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemTranslation" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MenuItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT,
    "zone" TEXT NOT NULL DEFAULT 'Salon',
    "qrToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiterCall" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'waiter',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "paymentMethod" TEXT,
    "paymentDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaiterCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuFeedback" (
    "id" TEXT NOT NULL,
    "tableId" TEXT,
    "type" TEXT NOT NULL,
    "menuItemId" TEXT,
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableOrder" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "TableOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "poster" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItemTranslation" (
    "id" TEXT NOT NULL,
    "galleryItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,

    CONSTRAINT "GalleryItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateKey" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationSlot" (
    "id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxCovers" INTEGER,
    "maxBookings" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "metaTitleTr" TEXT NOT NULL DEFAULT 'Ay''la Food & More | Bazı Şeyler Asla Değişmez',
    "metaTitleEn" TEXT NOT NULL DEFAULT 'Ay''la Food & More | Some Things Never Change',
    "metaTitleRu" TEXT NOT NULL DEFAULT 'Ay''la Food & More | Некоторые вещи никогда не меняются',
    "metaDescriptionTr" TEXT NOT NULL DEFAULT 'Ay''la Food & More | Bazı Şeyler Asla Değişmez. Akdeniz ve Türk mutfağı, steak & ızgara. Her gün 10:00–01:00.',
    "metaDescriptionEn" TEXT NOT NULL DEFAULT 'Ay''la Food & More | Some Things Never Change. Mediterranean & Turkish cuisine, steak & grill. Open daily 10:00–01:00.',
    "metaDescriptionRu" TEXT NOT NULL DEFAULT 'Ay''la Food & More | Некоторые вещи никогда не меняются. Средиземноморская и турецкая кухня, стейки и гриль. Ежедневно 10:00–01:00.',
    "metaKeywords" TEXT NOT NULL DEFAULT 'ayla food and more, ayla alanya, bazı şeyler asla değişmez, steak alanya, ızgara, akdeniz mutfağı, türk mutfağı, rezervasyon alanya',
    "ogImageUrl" TEXT NOT NULL DEFAULT '/hero_image.jpeg',
    "canonicalBaseUrl" TEXT NOT NULL DEFAULT 'https://aylaalanya.com',
    "robotsAllowIndex" BOOLEAN NOT NULL DEFAULT true,
    "structuredDataEnabled" BOOLEAN NOT NULL DEFAULT true,
    "googleSiteVerification" TEXT NOT NULL DEFAULT '',
    "bingSiteVerification" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "googleAnalyticsId" TEXT NOT NULL DEFAULT '',
    "googleTagManagerId" TEXT NOT NULL DEFAULT '',
    "facebookPixelId" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "content" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "locale" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "isMenu" BOOLEAN NOT NULL DEFAULT false,
    "tableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "meta" JSONB,
    "status" TEXT NOT NULL DEFAULT 'demo',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieConsent" (
    "id" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CookieConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL DEFAULT '',
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MessageBundle_locale_key" ON "MessageBundle"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_slug_key" ON "MenuCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_externalId_key" ON "MenuCategory"("externalId");

-- CreateIndex
CREATE INDEX "MenuCategory_published_sortOrder_idx" ON "MenuCategory"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuCategory_parentId_idx" ON "MenuCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategoryTranslation_categoryId_locale_key" ON "MenuCategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_slug_key" ON "MenuItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_externalId_key" ON "MenuItem"("externalId");

-- CreateIndex
CREATE INDEX "MenuItem_published_sortOrder_idx" ON "MenuItem"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemTranslation_menuItemId_locale_key" ON "MenuItemTranslation"("menuItemId", "locale");

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
CREATE INDEX "MenuFeedback_type_createdAt_idx" ON "MenuFeedback"("type", "createdAt");

-- CreateIndex
CREATE INDEX "TableOrder_status_createdAt_idx" ON "TableOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TableOrder_tableId_idx" ON "TableOrder"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryItemTranslation_galleryItemId_locale_key" ON "GalleryItemTranslation"("galleryItemId", "locale");

-- CreateIndex
CREATE INDEX "Reservation_dateKey_time_status_idx" ON "Reservation"("dateKey", "time", "status");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSlot_time_key" ON "ReservationSlot"("time");

-- CreateIndex
CREATE INDEX "ReservationSlot_enabled_sortOrder_idx" ON "ReservationSlot"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "MarketingCampaign_active_createdAt_idx" ON "MarketingCampaign"("active", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_path_createdAt_idx" ON "PageView"("path", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_isMenu_createdAt_idx" ON "PageView"("isMenu", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_utmCampaign_idx" ON "PageView"("utmCampaign");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_channel_createdAt_idx" ON "NotificationLog"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "CookieConsent_createdAt_idx" ON "CookieConsent"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"("ip", "createdAt");

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategoryTranslation" ADD CONSTRAINT "MenuCategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemTranslation" ADD CONSTRAINT "MenuItemTranslation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableOrder" ADD CONSTRAINT "TableOrder_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableOrderItem" ADD CONSTRAINT "TableOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TableOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableOrderItem" ADD CONSTRAINT "TableOrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItemTranslation" ADD CONSTRAINT "GalleryItemTranslation_galleryItemId_fkey" FOREIGN KEY ("galleryItemId") REFERENCES "GalleryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

