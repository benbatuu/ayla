import type { SiteSettings } from "../generated/prisma/client";
import { prisma } from "./prisma";
import { buildGoogleMapsLinks, isUsableHttpUrl } from "./google-maps";

export async function getSeoSettings() {
  return prisma.seoSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export function buildCanonicalUrl(baseUrl: string, locale: string, path = "") {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const localePath = locale === "tr" ? "" : `/${locale}`;
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${normalizedBase}${localePath}${suffix}`;
}

export function toE164Phone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  return `+${digits}`;
}

const SLOGANS: Record<string, string> = {
  tr: "Bazı Şeyler Asla Değişmez",
  en: "Some Things Never Change",
  ru: "Некоторые вещи никогда не меняются",
};

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function buildOpeningHours(openTime: string, closeTime: string) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const openMins = timeToMinutes(openTime);
  const closeMins = timeToMinutes(closeTime);
  const overnight = closeMins <= openMins;

  if (!overnight) {
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days,
        opens: openTime,
        closes: closeTime,
      },
    ];
  }

  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens: openTime,
      closes: "23:59",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens: "00:00",
      closes: closeTime,
    },
  ];
}

type RestaurantJsonLdInput = {
  settings: SiteSettings;
  seo: {
    canonicalBaseUrl: string;
    ogImageUrl: string;
    metaDescriptionTr: string;
    metaDescriptionEn: string;
    metaDescriptionRu: string;
  };
  locale: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  } | null;
};

export function buildRestaurantJsonLd({
  settings,
  seo,
  locale,
  aggregateRating,
}: RestaurantJsonLdInput) {
  const base = seo.canonicalBaseUrl.replace(/\/$/, "");
  const pageUrl = buildCanonicalUrl(seo.canonicalBaseUrl, locale);
  const maps = buildGoogleMapsLinks(settings);
  const description =
    locale === "en"
      ? seo.metaDescriptionEn
      : locale === "ru"
        ? seo.metaDescriptionRu
        : seo.metaDescriptionTr;

  const phones = [settings.phone, settings.phoneSecondary]
    .map((p) => toE164Phone(p))
    .filter(Boolean);

  const sameAs = [
    settings.instagramUrl,
    settings.facebookUrl,
    maps.mapUrl,
  ].filter((url) => isUsableHttpUrl(url));

  const imageUrl = settings.heroImageUrl.startsWith("http")
    ? settings.heroImageUrl
    : `${base}${settings.heroImageUrl.startsWith("/") ? "" : "/"}${settings.heroImageUrl}`;

  const ogUrl = seo.ogImageUrl.startsWith("http")
    ? seo.ogImageUrl
    : `${base}${seo.ogImageUrl.startsWith("/") ? "" : "/"}${seo.ogImageUrl}`;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${base}/#restaurant`,
    name: settings.businessName,
    alternateName: "Ay'la",
    description,
    url: pageUrl,
    image: [imageUrl, ogUrl].filter((v, i, a) => a.indexOf(v) === i),
    telephone: phones[0] || undefined,
    email: settings.email || undefined,
    servesCuisine: ["Mediterranean", "Turkish", "Steakhouse"],
    slogan: SLOGANS[locale] ?? SLOGANS.tr,
    priceRange: "$$",
    acceptsReservations: true,
    hasMenu: `${base}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine1,
      addressLocality: "Alanya",
      addressRegion: "Antalya",
      postalCode: settings.postalCode || "07400",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: settings.latitude,
      longitude: settings.longitude,
    },
    hasMap: maps.mapUrl,
    openingHoursSpecification: buildOpeningHours(
      settings.openTime,
      settings.closeTime
    ),
    ...(aggregateRating &&
    aggregateRating.ratingValue > 0 &&
    aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: aggregateRating.ratingValue,
            reviewCount: aggregateRating.reviewCount,
          },
        }
      : {}),
    sameAs,
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${pageUrl}#reservation`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      result: {
        "@type": "Reservation",
        name: "Table reservation",
      },
    },
  };
}
