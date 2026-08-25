import { notFound } from "next/navigation";
import QrMenuApp from "../../../../components/qr-menu/QrMenuApp";
import { getMenuSettings, getQrMenu, getTableByToken } from "../../../../lib/qr-menu";
import { getSiteSettings } from "../../../../lib/content";

export const dynamic = "force-dynamic";

export default async function QrMenuTableEnPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const table = await getTableByToken(token);

  if (!table) {
    notFound();
  }

  const [menuSettings, siteSettings, menuTr, menuEn, menuRu] = await Promise.all([
    getMenuSettings(),
    getSiteSettings(),
    getQrMenu("tr"),
    getQrMenu("en"),
    getQrMenu("ru"),
  ]);

  return (
    <QrMenuApp
      initialLocale="en"
      table={{
        number: table.number,
        label: table.label,
        zone: table.zone,
        token: table.qrToken,
      }}
      menuSettings={menuSettings}
      siteSettings={{
        businessName: siteSettings.businessName,
        phone: siteSettings.phone,
        phoneSecondary: siteSettings.phoneSecondary,
        email: siteSettings.email,
        openTime: siteSettings.openTime,
        closeTime: siteSettings.closeTime,
        country: siteSettings.country,
        mapUrl: siteSettings.mapUrl,
        googlePlaceFeatureId: siteSettings.googlePlaceFeatureId,
        googlePlaceId: siteSettings.googlePlaceId,
        instagramUrl: siteSettings.instagramUrl,
        instagramHandle: siteSettings.instagramHandle,
        facebookUrl: siteSettings.facebookUrl,
        googleReviewsUrl: siteSettings.googleReviewsUrl,
        tripadvisorUrl: siteSettings.tripadvisorUrl,
        heroImageUrl: siteSettings.heroImageUrl,
      }}
      menuByLocale={{ tr: menuTr, en: menuEn, ru: menuRu }}
    />
  );
}
