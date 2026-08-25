import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { generateTimeSlots } from "../app/lib/content";
import enMessages from "../app/messages/en.json";
import ruMessages from "../app/messages/ru.json";
import trMessages from "../app/messages/tr.json";
import { qrTekproCategories, resolveCategoryImage } from "./qrtekpro-categories";
import { seedQrTekproProducts } from "./qrtekpro-import";

const prisma = new PrismaClient();

const gallerySeed = [
  {
    type: "video",
    src: "/reels/reels-01.mp4",
    poster: "/gallery/gallery-01.jpg",
    sortOrder: 0,
    tr: { title: "Ateşin başında", subtitle: "The kitchen" },
    en: { title: "By the fire", subtitle: "The kitchen" },
  },
  {
    type: "image",
    src: "/gallery/gallery-01.jpg",
    poster: null,
    sortOrder: 1,
    tr: { title: "Uzun akşamlar", subtitle: "At the table" },
    en: { title: "Long evenings", subtitle: "At the table" },
  },
  {
    type: "video",
    src: "/reels/reels-02.mp4",
    poster: "/gallery/gallery-02.jpg",
    sortOrder: 2,
    tr: { title: "Sofraya doğru", subtitle: "Dinner is coming" },
    en: { title: "Toward the table", subtitle: "Dinner is coming" },
  },
  {
    type: "image",
    src: "/gallery/gallery-02.jpg",
    poster: null,
    sortOrder: 3,
    tr: { title: "Bir masa", subtitle: "Ay'la" },
    en: { title: "One table", subtitle: "Ay'la" },
  },
  {
    type: "video",
    src: "/reels/reels-03.mp4",
    poster: "/gallery/gallery-03.jpg",
    sortOrder: 4,
    tr: { title: "Gece başlarken", subtitle: "After sunset" },
    en: { title: "As night begins", subtitle: "After sunset" },
  },
  {
    type: "image",
    src: "/gallery/gallery-03.jpg",
    poster: null,
    sortOrder: 5,
    tr: { title: "İyi yemek", subtitle: "Good food" },
    en: { title: "Good food", subtitle: "Good food" },
  },
  {
    type: "image",
    src: "/gallery/gallery-05.jpg",
    poster: null,
    sortOrder: 6,
    tr: { title: "Ay'la", subtitle: "Alanya" },
    en: { title: "Ay'la", subtitle: "Alanya" },
  },
  {
    type: "image",
    src: "/gallery/gallery-06.jpg",
    poster: null,
    sortOrder: 7,
    tr: { title: "Ay'la", subtitle: "Alanya" },
    en: { title: "Ay'la", subtitle: "Alanya" },
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@ayla.restaurant";
  const password = process.env.ADMIN_PASSWORD ?? "ayla2026";
  const forcePasswordReset = process.env.FORCE_ADMIN_PASSWORD_RESET === "1";
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin",
      ...(forcePasswordReset ? { password: hashedPassword } : {}),
    },
    create: { email, password: hashedPassword, name: "Admin" },
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      businessName: "Ay'la Food & More",
      phone: "+90 549 613 53 73",
      phoneSecondary: "+90 242 502 71 70",
      email: "reservation@aylaalanya.com",
      addressLine1: "Kadıpaşa, Sugözü Cd. No:10",
      addressLine2: "07400 Alanya / Antalya",
      country: "Türkiye",
      postalCode: "07400",
      latitude: 36.5484256,
      longitude: 31.9945747,
      mapUrl:
        "https://www.google.com/maps/place/Ay'La+Food+%26+More/@36.5484256,31.9945747,17z/data=!4m6!3m5!1s0x14dc9983c30ef407:0xf396f6025729a5bb!8m2!3d36.5484256!4d31.9945747!16s%2Fg%2F11z0mq9pyl",
      googlePlaceFeatureId: "0x14dc9983c30ef407:0xf396f6025729a5bb",
      googlePlaceId: "ChIJB_QOw4OZ3BQRu6UpVwL2lvM",
      instagramUrl: "https://www.instagram.com/ayla_alanya/",
      instagramHandle: "@ayla_alanya",
      facebookUrl: "https://www.facebook.com/aylaalanyaa",
      googleReviewsUrl:
        "https://search.google.com/local/writereview?placeid=ChIJB_QOw4OZ3BQRu6UpVwL2lvM",
      tripadvisorUrl: "",
      openTime: "10:00",
      closeTime: "01:00",
    },
    create: {
      id: "default",
      businessName: "Ay'la Food & More",
      phone: "+90 549 613 53 73",
      phoneSecondary: "+90 242 502 71 70",
      email: "reservation@aylaalanya.com",
      addressLine1: "Kadıpaşa, Sugözü Cd. No:10",
      addressLine2: "07400 Alanya / Antalya",
      country: "Türkiye",
      postalCode: "07400",
      latitude: 36.5484256,
      longitude: 31.9945747,
      mapUrl:
        "https://www.google.com/maps/place/Ay'La+Food+%26+More/@36.5484256,31.9945747,17z/data=!4m6!3m5!1s0x14dc9983c30ef407:0xf396f6025729a5bb!8m2!3d36.5484256!4d31.9945747!16s%2Fg%2F11z0mq9pyl",
      googlePlaceFeatureId: "0x14dc9983c30ef407:0xf396f6025729a5bb",
      googlePlaceId: "ChIJB_QOw4OZ3BQRu6UpVwL2lvM",
      instagramUrl: "https://www.instagram.com/ayla_alanya/",
      instagramHandle: "@ayla_alanya",
      facebookUrl: "https://www.facebook.com/aylaalanyaa",
      googleReviewsUrl:
        "https://search.google.com/local/writereview?placeid=ChIJB_QOw4OZ3BQRu6UpVwL2lvM",
      tripadvisorUrl: "",
      openTime: "10:00",
      closeTime: "01:00",
    },
  });

  await prisma.seoSettings.upsert({
    where: { id: "default" },
    update: {
      metaTitleTr: "Ay'la Food & More | Bazı Şeyler Asla Değişmez",
      metaTitleEn: "Ay'la Food & More | Some Things Never Change",
      metaTitleRu: "Ay'la Food & More | Некоторые вещи никогда не меняются",
      metaDescriptionTr:
        "Ay'la Food & More | Bazı Şeyler Asla Değişmez. Akdeniz ve Türk mutfağı, steak & ızgara. Her gün 10:00–01:00.",
      metaDescriptionEn:
        "Ay'la Food & More | Some Things Never Change. Mediterranean & Turkish cuisine, steak & grill. Open daily 10:00–01:00.",
      metaDescriptionRu:
        "Ay'la Food & More | Некоторые вещи никогда не меняются. Средиземноморская и турецкая кухня, стейки и гриль. Ежедневно 10:00–01:00.",
      metaKeywords:
        "ayla food and more, ayla alanya, bazı şeyler asla değişmez, steak alanya, ızgara, akdeniz mutfağı, türk mutfağı, rezervasyon alanya",
      ogImageUrl: "/hero_image.jpeg",
      canonicalBaseUrl: "https://aylaalanya.com",
      robotsAllowIndex: true,
      structuredDataEnabled: true,
    },
    create: { id: "default" },
  });

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (settings) {
    const times = generateTimeSlots(
      settings.openTime,
      settings.closeTime,
      settings.timeSlotInterval
    );

    for (let index = 0; index < times.length; index++) {
      await prisma.reservationSlot.upsert({
        where: { time: times[index] },
        update: { sortOrder: index, enabled: true },
        create: { time: times[index], sortOrder: index, enabled: true },
      });
    }
  }

  await prisma.messageBundle.upsert({
    where: { locale: "tr" },
    update: { data: trMessages },
    create: { locale: "tr", data: trMessages },
  });

  await prisma.messageBundle.upsert({
    where: { locale: "en" },
    update: { data: enMessages },
    create: { locale: "en", data: enMessages },
  });

  await prisma.messageBundle.upsert({
    where: { locale: "ru" },
    update: { data: ruMessages },
    create: { locale: "ru", data: ruMessages },
  });

  await prisma.menuSettings.upsert({
    where: { id: "default" },
    update: {
      wifiSsid: "Ay'la-Guest",
      wifiPassword: "ayla2026",
      menuBaseUrl: process.env.MENU_BASE_URL ?? "http://menu.localhost:3000",
      menuLogoUrl: "/ayla_logo.jpg",
    },
    create: {
      id: "default",
      wifiSsid: "Ay'la-Guest",
      wifiPassword: "ayla2026",
      menuBaseUrl: process.env.MENU_BASE_URL ?? "http://menu.localhost:3000",
      menuLogoUrl: "/ayla_logo.jpg",
    },
  });

  await prisma.seoSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  await prisma.marketingSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  await prisma.menuItemTranslation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategoryTranslation.deleteMany();
  await prisma.menuCategory.deleteMany();

  const categoryIdByExternal = new Map<number, string>();

  for (const def of qrTekproCategories.filter((c) => !c.parentExternalId)) {
    const created = await prisma.menuCategory.create({
      data: {
        slug: def.slug,
        externalId: def.externalId,
        sortOrder: def.sortOrder,
        imageUrl: resolveCategoryImage(def.image),
        hasSubcategories: def.hasChildren,
        translations: {
          create: [
            { locale: "tr", name: def.name },
            { locale: "en", name: def.enName ?? def.name },
          ],
        },
      },
    });
    categoryIdByExternal.set(def.externalId, created.id);
  }

  for (const def of qrTekproCategories.filter((c) => c.parentExternalId)) {
    const parentId = categoryIdByExternal.get(def.parentExternalId!);
    if (!parentId) {
      throw new Error(`Missing parent category ${def.parentExternalId} for ${def.name}`);
    }

    const created = await prisma.menuCategory.create({
      data: {
        slug: def.slug,
        externalId: def.externalId,
        parentId,
        sortOrder: def.sortOrder,
        imageUrl: resolveCategoryImage(def.image),
        hasSubcategories: def.hasChildren,
        translations: {
          create: [
            { locale: "tr", name: def.name },
            { locale: "en", name: def.enName ?? def.name },
          ],
        },
      },
    });
    categoryIdByExternal.set(def.externalId, created.id);
  }

  const productCount = await seedQrTekproProducts(prisma, categoryIdByExternal);
  console.log(`Imported ${productCount} menu items from QrTekpro.`);

  for (let number = 1; number <= 8; number++) {
    await prisma.restaurantTable.upsert({
      where: { number },
      update: { active: true },
      create: {
        number,
        zone: number <= 6 ? "Salon" : "Teras",
        label: number <= 6 ? `Salon ${number}` : `Teras ${number - 6}`,
      },
    });
  }

  await prisma.galleryItemTranslation.deleteMany();
  await prisma.galleryItem.deleteMany();

  for (const item of gallerySeed) {
    await prisma.galleryItem.create({
      data: {
        type: item.type,
        src: item.src,
        poster: item.poster,
        sortOrder: item.sortOrder,
        translations: {
          create: [
            { locale: "tr", ...item.tr },
            { locale: "en", ...item.en },
          ],
        },
      },
    });
  }

  console.log("Seed completed.");
  if (forcePasswordReset) {
    console.log(`Admin login: ${email} / ${password} (password force-reset)`);
  } else {
    console.log(`Admin email upserted: ${email} (password unchanged unless new user)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
