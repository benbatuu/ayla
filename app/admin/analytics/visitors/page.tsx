import AdminPageHeader, { AdminCard, AdminSection } from "../../components/AdminPageHeader";
import { BarList, DataTable, RangeTabs, StatGrid } from "../../components/AnalyticsUI";
import AdminShell from "../../components/AdminShell";
import { getAdminUser } from "../../layout";
import { getVisitorAnalytics } from "../../../lib/analytics";
import type { DateRange } from "../../../lib/analytics";

export default async function AnalyticsVisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getAdminUser();
  const { range: rawRange } = await searchParams;
  const range = (["7d", "30d", "90d", "all"].includes(rawRange ?? "")
    ? rawRange
    : "30d") as DateRange;

  const data = await getVisitorAnalytics(range);

  return (
    <AdminShell user={user} wide>
      <AdminPageHeader
        title="Ziyaretçi Analizi"
        description="Site ve QR menü trafiği, kaynaklar, kampanyalar ve oturum metrikleri."
      />

      <div className="mb-8">
        <RangeTabs current={range} basePath="/admin/analytics/visitors" />
      </div>

      <StatGrid
        items={[
          { label: "Toplam Görüntüleme", value: data.totalViews },
          { label: "Tekil Ziyaretçi", value: data.uniqueVisitors },
          { label: "Site Trafiği", value: data.siteViews },
          { label: "QR Menü Trafiği", value: data.menuViews },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-6 text-lg">Popüler Sayfalar</h2>
          {data.topPaths.length > 0 ? (
            <BarList
              items={data.topPaths.map((item) => ({
                label: item.path,
                value: item.count,
              }))}
            />
          ) : (
            <p className="text-sm text-white/35">Sayfa verisi yok.</p>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="mb-6 text-lg">Dil Dağılımı</h2>
          {data.byLocale.length > 0 ? (
            <BarList
              items={data.byLocale.map((item) => ({
                label: item.locale.toUpperCase(),
                value: item.count,
              }))}
            />
          ) : (
            <p className="text-sm text-white/35">Dil verisi yok.</p>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="mb-6 text-lg">Trafik Kaynakları</h2>
          {data.byReferrer.length > 0 ? (
            <BarList
              items={data.byReferrer.map((item) => ({
                label: item.referrer,
                value: item.count,
              }))}
            />
          ) : (
            <p className="text-sm text-white/35">Referrer verisi yok.</p>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="mb-6 text-lg">Kampanya Trafiği (UTM)</h2>
          {data.byCampaign.length > 0 ? (
            <BarList
              items={data.byCampaign.map((item) => ({
                label: item.campaign,
                value: item.count,
              }))}
            />
          ) : (
            <p className="text-sm text-white/35">
              UTM parametreli ziyaret henüz yok. Pazarlama → Kampanyalar bölümünden link oluşturun.
            </p>
          )}
        </AdminCard>
      </div>

      <AdminSection title="Son Ziyaretler" className="mt-8">
        {data.recent.length > 0 ? (
          <DataTable
            headers={["Tarih", "Sayfa", "Dil", "Menü", "Kampanya", "Referrer"]}
            rows={data.recent.map((view) => [
              view.createdAt.toLocaleString("tr-TR"),
              view.path,
              view.locale ?? "—",
              view.isMenu ? "Evet" : "Hayır",
              view.campaign ?? "—",
              view.referrer ? (view.referrer.length > 40 ? `${view.referrer.slice(0, 40)}…` : view.referrer) : "Doğrudan",
            ])}
          />
        ) : (
          <p className="text-sm text-white/35">Ziyaret kaydı yok.</p>
        )}
      </AdminSection>
    </AdminShell>
  );
}
