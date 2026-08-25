import { setRequestLocale } from "next-intl/server";
import MarketingShell from "../components/MarketingShell";
import AtmosphereGallery from "../components/AtmosphereGallery";
import FaqSection from "../components/FaqSection";
import Footer from "../components/Footer";
import RestaurantHeader from "../components/Header";
import Hero from "../components/Hero";
import LocaleProvider from "../components/LocaleProvider";
import ReservationFinale from "../components/ReservationFinale";
import SignatureMenu from "../components/SignatureMenu";
import { SiteDataProvider } from "../components/SiteDataProvider";
import SocialProof from "../components/SocialProof";
import RestaurantStory from "../components/StorySection";
import { getHomepageGoogleReviews, getPublicSiteData, type Locale } from "../lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  const [trData, enData, ruData, googleReviewSummary] = await Promise.all([
    getPublicSiteData("tr"),
    getPublicSiteData("en"),
    getPublicSiteData("ru"),
    getHomepageGoogleReviews(),
  ]);

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
        menuByLocale={{ tr: trData.menuItems, en: enData.menuItems, ru: ruData.menuItems }}
        galleryByLocale={{ tr: trData.galleryItems, en: enData.galleryItems, ru: ruData.galleryItems }}
      >
        <MarketingShell>
          <RestaurantHeader />
          <main id="main-content">
            <Hero />
            <RestaurantStory />
            <SignatureMenu />
            <AtmosphereGallery />
            <SocialProof />
            <FaqSection />
            <ReservationFinale />
          </main>
          <Footer />
        </MarketingShell>
      </SiteDataProvider>
    </LocaleProvider>
  );
}
