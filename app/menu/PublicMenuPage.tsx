import QrMenuApp from "../components/qr-menu/QrMenuApp";
import { getPublicMenuPageData } from "../lib/qr-menu";
import type { QrLocale } from "../lib/qr-menu";

export const dynamic = "force-dynamic";

export default async function PublicMenuPage({
  locale,
}: {
  locale: QrLocale;
}) {
  const { menuSettings, siteSettings, menuByLocale } =
    await getPublicMenuPageData();

  return (
    <QrMenuApp
      mode="browse"
      initialLocale={locale}
      menuSettings={menuSettings}
      siteSettings={siteSettings}
      menuByLocale={menuByLocale}
    />
  );
}
