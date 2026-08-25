import AdminField from "../components/AdminField";
import AdminPageHeader, { AdminCard, AdminSection } from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import { updateMarketingSettingsAction } from "../actions";
import { getAdminUser } from "../layout";
import { getMarketingSettings } from "../../lib/marketing";
import { getVisitorAnalytics } from "../../lib/analytics";
import Link from "next/link";

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getAdminUser();
  const [settings, visitors] = await Promise.all([
    getMarketingSettings(),
    getVisitorAnalytics("30d"),
  ]);
  const params = await searchParams;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Pazarlama Entegrasyonları"
        description="Google Analytics, Tag Manager ve Facebook Pixel bağlantıları."
      />

      {params.saved === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Pazarlama ayarları kaydedildi.
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">30g Ziyaret</p>
          <p className="mt-3 font-brand text-4xl italic">{visitors.totalViews}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Tekil Ziyaretçi</p>
          <p className="mt-3 font-brand text-4xl italic">{visitors.uniqueVisitors}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">UTM Kampanyası</p>
          <p className="mt-3 font-brand text-4xl italic">{visitors.byCampaign.length}</p>
        </AdminCard>
      </div>

      <form action={updateMarketingSettingsAction} className="space-y-8">
        <AdminSection title="Analitik & Pixel">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField
              label="Google Analytics ID"
              name="googleAnalyticsId"
              defaultValue={settings.googleAnalyticsId}
              placeholder="G-XXXXXXXXXX"
            />
            <AdminField
              label="Google Tag Manager ID"
              name="googleTagManagerId"
              defaultValue={settings.googleTagManagerId}
              placeholder="GTM-XXXXXXX"
            />
            <AdminField
              label="Facebook Pixel ID"
              name="facebookPixelId"
              defaultValue={settings.facebookPixelId}
              placeholder="1234567890"
            />
          </div>
          <p className="mt-4 text-xs text-white/35">
            Bu kodlar siteye otomatik enjekte edilir. Detaylı raporlar için{" "}
            <Link href="/admin/analytics" className="underline">
              Analitik
            </Link>{" "}
            panelini kullanın.
          </p>
        </AdminSection>

        <button
          type="submit"
          className="rounded-full bg-[#f3f1eb] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
        >
          Kaydet
        </button>
      </form>

      <AdminSection title="Pazarlama Araçları" className="mt-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/admin/marketing/campaigns" className="rounded-2xl border border-white/10 px-4 py-4 text-sm hover:bg-white/5">
            UTM Kampanya Oluşturucu →
          </Link>
          <Link href="/admin/analytics/visitors" className="rounded-2xl border border-white/10 px-4 py-4 text-sm hover:bg-white/5">
            Kampanya Trafiği Raporu →
          </Link>
          <Link href="/admin/seo/local" className="rounded-2xl border border-white/10 px-4 py-4 text-sm hover:bg-white/5">
            Yerel SEO Kontrol →
          </Link>
          <Link href="/admin/settings" className="rounded-2xl border border-white/10 px-4 py-4 text-sm hover:bg-white/5">
            Sosyal Medya Bağlantıları →
          </Link>
        </div>
      </AdminSection>
    </AdminShell>
  );
}
