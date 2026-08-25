import { NextResponse } from "next/server";
import { getMenuSettings, getQrMenu, getTableByToken } from "../../../lib/qr-menu";
import { getSiteSettings } from "../../../lib/content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const table = await getTableByToken(token);

    if (!table) {
      return NextResponse.json({ error: "Masa bulunamadı." }, { status: 404 });
    }

    const [menuSettings, siteSettings, menuTr, menuEn, menuRu] = await Promise.all([
      getMenuSettings(),
      getSiteSettings(),
      getQrMenu("tr"),
      getQrMenu("en"),
      getQrMenu("ru"),
    ]);

    return NextResponse.json({
      table: {
        number: table.number,
        label: table.label,
        zone: table.zone,
        token: table.qrToken,
      },
      settings: menuSettings,
      site: {
        phone: siteSettings.phone,
        openTime: siteSettings.openTime,
        closeTime: siteSettings.closeTime,
        country: siteSettings.country,
      },
      menu: { tr: menuTr, en: menuEn, ru: menuRu },
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Menü yüklenemedi." }, { status: 500 });
  }
}
