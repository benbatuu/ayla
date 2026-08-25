import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import MarketingShell from "../../components/MarketingShell";
import LegalDocument from "../../components/LegalDocument";
import RestaurantHeader from "../../components/Header";
import Footer from "../../components/Footer";
import LocaleProvider from "../../components/LocaleProvider";
import { SiteDataProvider } from "../../components/SiteDataProvider";
import {
  getHomepageGoogleReviews,
  getPublicSiteData,
  type Locale,
} from "../../lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const [trData, enData, ruData, googleReviewSummary] = await Promise.all([
    getPublicSiteData("tr"),
    getPublicSiteData("en"),
    getPublicSiteData("ru"),
    getHomepageGoogleReviews(),
  ]);

  const sections = t.raw("sections") as Array<{
    title: string;
    paragraphs: string[];
  }>;

  return (
    <LocaleProvider
      initialLocale={locale}
      messagesByLocale={{
        tr: trData.messages,
        en: enData.messages,
        ru: ruData.messages,
      }}
    >
      <SiteDataProvider
        settings={trData.settings}
        googleReviewSummary={googleReviewSummary}
        menuByLocale={{
          tr: trData.menuItems,
          en: enData.menuItems,
          ru: ruData.menuItems,
        }}
        galleryByLocale={{
          tr: trData.galleryItems,
          en: enData.galleryItems,
          ru: ruData.galleryItems,
        }}
      >
        <MarketingShell>
          <RestaurantHeader variant="light" />
          <main>
            <LegalDocument
              title={t("title")}
              updated={t("updated")}
              intro={t("intro")}
              sections={sections}
              backLabel={t("back")}
            />
          </main>
          <Footer />
        </MarketingShell>
      </SiteDataProvider>
    </LocaleProvider>
  );
}
