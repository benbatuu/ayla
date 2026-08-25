import enMessages from "../messages/en.json";
import ruMessages from "../messages/ru.json";
import trMessages from "../messages/tr.json";
import { getGoogleReviewSummary, type GoogleReviewSummary } from "./google-reviews";
import { deepMergeMessages, pickTranslation, type AppLocale } from "./locale";
import { prisma } from "./prisma";
import {
  SIGNATURE_DISH_IMAGES,
  WEBSITE_SIGNATURE_DISH_LIMIT,
} from "./signature-dishes";

export type Locale = AppLocale;

export const locales: Locale[] = ["tr", "en", "ru"];

export { SIGNATURE_DISH_IMAGES, WEBSITE_SIGNATURE_DISH_LIMIT };

/** @deprecated Use SIGNATURE_DISH_IMAGES */
export const SIGNATURE_CUTOUTS = SIGNATURE_DISH_IMAGES;

const fallbackMessages: Record<Locale, Record<string, unknown>> = {
  en: enMessages,
  tr: trMessages,
  ru: ruMessages,
};

export async function getMessages(locale: Locale) {
  const fallback = fallbackMessages[locale] ?? fallbackMessages.tr;

  try {
    const bundle = await prisma.messageBundle.findUnique({
      where: { locale },
    });

    if (bundle?.data && typeof bundle.data === "object") {
      return deepMergeMessages(fallback, bundle.data as Record<string, unknown>);
    }
  } catch {
    // Database unavailable — fall back to static messages
  }

  return fallback;
}

export async function getSiteSettings() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (settings) {
      return settings;
    }

    return prisma.siteSettings.create({
      data: { id: "default" },
    });
  } catch {
    return {
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
      mapUrl: "",
      googlePlaceFeatureId: "0x14dc9983c30ef407:0xf396f6025729a5bb",
      googlePlaceId: "ChIJB_QOw4OZ3BQRu6UpVwL2lvM",
      instagramUrl: "https://www.instagram.com/ayla_alanya/",
      instagramHandle: "@ayla_alanya",
      facebookUrl: "https://www.facebook.com/aylaalanyaa",
      googleReviewsUrl: "",
      tripadvisorUrl: "",
      privacyUrl: "",
      kvkkUrl: "",
      openTime: "10:00",
      closeTime: "01:00",
      maxGuests: 12,
      largePartyPhoneThreshold: 8,
      maxReservationDaysAhead: 7,
      timeSlotInterval: 30,
      maxCoversPerSlot: 24,
      maxReservationsPerSlot: 8,
      whatsappUrl: "https://wa.me/905496135373",
      directionsNoteTr:
        "Kadıpaşa Mahallesi, Sugözü Cd. No:10. Alanya merkez / Kleopatra tarafına yakın. Taksi ve araçla kolay ulaşım; sokak üzeri park imkânı sınırlıdır — yakındaki otoparkları tercih edebilirsiniz.",
      directionsNoteEn:
        "Kadıpaşa, Sugözü Cd. No:10. Near central Alanya / Kleopatra area. Easy by taxi or car; street parking is limited — nearby lots are recommended.",
      directionsNoteRu:
        "Kadıpaşa, Sugözü Cd. No:10. Рядом с центром Аланьи / Клеопатрой. Удобно на такси или машине; уличная парковка ограничена — рекомендуем ближайшие стоянки.",
      heroImageUrl: "/hero_image.jpeg",
      storyImageMain: "/story_main.jpeg",
      storyImageKitchen: "/kitchen.jpeg",
      storyImageTable: "/table.jpeg",
      storyImageAyla: "/ayla.jpeg",
      reservationBgUrl: "/table.jpeg",
      galleryImageDuration: 5500,
      updatedAt: new Date(),
    };
  }
}

export async function getMenuItems(locale: Locale) {
  try {
    const featured = await prisma.menuItem.findMany({
      where: { published: true, isFeatured: true },
      orderBy: { sortOrder: "asc" },
      take: WEBSITE_SIGNATURE_DISH_LIMIT,
      include: { translations: true },
    });

    if (featured.length > 0) {
      return featured.map((item, index) => {
        const translation = pickTranslation(item.translations, locale);
        return {
          number: String(index + 1).padStart(2, "0"),
          category: translation?.category ?? "",
          name: translation?.name ?? "",
          description: translation?.description ?? "",
          image: SIGNATURE_DISH_IMAGES[index] ?? item.imageUrl,
          price: item.price ?? "—",
        };
      });
    }
  } catch {
    // fall through to static messages
  }

  const messages = (await getMessages(locale)) as {
    menu: {
      dishes: Array<{
        category: string;
        name: string;
        description: string;
      }>;
    };
  };

  return messages.menu.dishes
    .slice(0, WEBSITE_SIGNATURE_DISH_LIMIT)
    .map((dish, index) => ({
      number: String(index + 1).padStart(2, "0"),
      category: dish.category,
      name: dish.name,
      description: dish.description,
      image: SIGNATURE_DISH_IMAGES[index] ?? SIGNATURE_DISH_IMAGES[0],
      price: "—",
    }));
}

export async function getGalleryItems(locale: Locale) {
  try {
    const items = await prisma.galleryItem.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: true,
      },
    });

    if (items.length > 0) {
      return items.map((item) => {
        const translation = pickTranslation(item.translations, locale);
        return {
          type: item.type as "image" | "video",
          src: item.src,
          poster: item.poster ?? undefined,
          title: translation?.title ?? "",
          subtitle: translation?.subtitle ?? "",
        };
      });
    }
  } catch {
    // fall through to static fallback
  }

  const messages = fallbackMessages[locale] as {
    atmosphere: {
      items: Array<{ title: string; subtitle: string }>;
    };
  };
  const sources = [
    { type: "video" as const, src: "/reels/reels-01.mp4", poster: "/gallery/gallery-01.jpg" },
    { type: "image" as const, src: "/gallery/gallery-01.jpg" },
    { type: "video" as const, src: "/reels/reels-02.mp4", poster: "/gallery/gallery-02.jpg" },
    { type: "image" as const, src: "/gallery/gallery-02.jpg" },
    { type: "video" as const, src: "/reels/reels-03.mp4", poster: "/gallery/gallery-03.jpg" },
    { type: "image" as const, src: "/gallery/gallery-03.jpg" },
    { type: "image" as const, src: "/gallery/gallery-05.jpg" },
    { type: "image" as const, src: "/gallery/gallery-06.jpg" },
  ];

  return sources.map((source, index) => ({
    ...source,
    title: messages.atmosphere.items[index]?.title ?? "",
    subtitle: messages.atmosphere.items[index]?.subtitle ?? "",
  }));
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number
) {
  const slots: string[] = [];
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  let current = openHour * 60 + openMinute;
  let end = closeHour * 60 + closeMinute;

  // e.g. 18:00–00:00 means open until midnight (next day)
  if (end <= current) {
    end += 24 * 60;
  }

  while (current <= end) {
    const hour = Math.floor(current / 60) % 24;
    const minute = current % 60;
    slots.push(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    );
    current += intervalMinutes;
  }

  return slots;
}

export type { GoogleReviewSummary };

export async function getPublicSiteData(locale: Locale) {
  const [messages, settings, menuItems, galleryItems] = await Promise.all([
    getMessages(locale),
    getSiteSettings(),
    getMenuItems(locale),
    getGalleryItems(locale),
  ]);

  return {
    messages,
    settings,
    menuItems,
    galleryItems,
  };
}

export async function getHomepageGoogleReviews(): Promise<GoogleReviewSummary> {
  const settings = await getSiteSettings();
  return getGoogleReviewSummary(settings);
}
