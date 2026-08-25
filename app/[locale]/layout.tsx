import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import PageViewTracker from "../components/PageViewTracker";
import StructuredData from "../components/StructuredData";
import { routing } from "../i18n/routing";
import {
  getHomepageGoogleReviews,
  getMessages,
  getSiteSettings,
  type Locale,
} from "../lib/content";
import {
  buildCanonicalUrl,
  buildRestaurantJsonLd,
  getSeoSettings,
} from "../lib/seo";
import enMessages from "../messages/en.json";
import ruMessages from "../messages/ru.json";
import trMessages from "../messages/tr.json";

const fallbackMessages = { en: enMessages, tr: trMessages, ru: ruMessages };
const SITE_URL =
  process.env.SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://aylaalanya.com";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = await getSeoSettings();
  const messages = await getMessages(locale as Locale);
  const safeLocale = routing.locales.includes(locale as "en" | "tr" | "ru")
    ? (locale as "en" | "tr" | "ru")
    : routing.defaultLocale;
  const metadata = (messages.metadata ??
    fallbackMessages[safeLocale].metadata) as {
    title: string;
    description: string;
  };

  const title =
    safeLocale === "en"
      ? seo.metaTitleEn
      : safeLocale === "ru"
        ? seo.metaTitleRu
        : seo.metaTitleTr;
  const description =
    safeLocale === "en"
      ? seo.metaDescriptionEn
      : safeLocale === "ru"
        ? seo.metaDescriptionRu
        : seo.metaDescriptionTr;

  const canonical = buildCanonicalUrl(seo.canonicalBaseUrl, safeLocale);

  return {
    metadataBase: new URL(SITE_URL),
    title: title || metadata.title,
    description: description || metadata.description,
    keywords: seo.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: {
      canonical,
      languages: {
        "tr-TR": buildCanonicalUrl(seo.canonicalBaseUrl, "tr"),
        "en-US": buildCanonicalUrl(seo.canonicalBaseUrl, "en"),
        "ru-RU": buildCanonicalUrl(seo.canonicalBaseUrl, "ru"),
        "x-default": buildCanonicalUrl(seo.canonicalBaseUrl, "tr"),
      },
    },
    openGraph: {
      title: title || metadata.title,
      description: description || metadata.description,
      url: canonical,
      siteName: "Ay'la Food & More",
      images: [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: "Ay'la Food & More" }],
      locale:
        safeLocale === "en" ? "en_US" : safeLocale === "ru" ? "ru_RU" : "tr_TR",
      alternateLocale:
        safeLocale === "tr"
          ? ["en_US", "ru_RU"]
          : safeLocale === "en"
            ? ["tr_TR", "ru_RU"]
            : ["tr_TR", "en_US"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title || metadata.title,
      description: description || metadata.description,
      images: [seo.ogImageUrl],
    },
    robots: seo.robotsAllowIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
    verification: {
      google: seo.googleSiteVerification || undefined,
      other: seo.bingSiteVerification
        ? { "msvalidate.01": seo.bingSiteVerification }
        : undefined,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "tr" | "ru")) {
    notFound();
  }

  setRequestLocale(locale);

  const [seo, settings, googleReviews] = await Promise.all([
    getSeoSettings(),
    getSiteSettings(),
    getHomepageGoogleReviews(),
  ]);

  const aggregateRating =
    googleReviews.rating != null &&
    googleReviews.reviewCount != null &&
    googleReviews.reviewCount > 0
      ? {
          ratingValue: googleReviews.rating,
          reviewCount: googleReviews.reviewCount,
        }
      : null;

  const jsonLd =
    seo.structuredDataEnabled
      ? buildRestaurantJsonLd({ settings, seo, locale, aggregateRating })
      : null;

  return (
    <>
      {jsonLd ? <StructuredData data={jsonLd} /> : null}
      <PageViewTracker locale={locale} />
      {children}
    </>
  );
}
