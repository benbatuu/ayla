import AdminPageHeader, { AdminCard, AdminSection } from "../components/AdminPageHeader";
import { BarList, RangeTabs, StatGrid } from "../components/AnalyticsUI";
import AdminShell from "../components/AdminShell";
import { getAdminUser } from "../layout";
import { getAnalyticsOverview, getVisitorAnalytics } from "../../lib/analytics";
import type { DateRange } from "../../lib/analytics";
import Link from "next/link";

export default async function AnalyticsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getAdminUser();
  const { range: rawRange } = await searchParams;
  const range = (["7d", "30d", "90d", "all"].includes(rawRange ?? "")
    ? rawRange
    : "30d") as DateRange;

  const [overview, visitors] = await Promise.all([
    getAnalyticsOverview(range),
    getVisitorAnalytics(range),
  ]);

  return (
    <AdminShell user={user} wide>
      <AdminPageHeader
        title="Analitik"
        description="Gelir, sipariş, ziyaretçi ve dönüşüm metriklerinin genel özeti."
      />

      <div className="mb-8">
        <RangeTabs current={range} basePath="/admin/analytics" />
      </div>

      <StatGrid
        items={[
          { label: "Toplam Gelir", value: overview.formattedRevenue, hint: "Servis edilen siparişler" },
          { label: "Bekleyen Gelir", value: overview.formattedPipeline, hint: "Yeni + hazırlanan" },
          { label: "Sipariş", value: overview.orderCount, hint: `${overview.servedCount} servis edildi` },
          { label: "Ort. Sipariş", value: overview.avgOrderValue },
          { label: "Sayfa Görüntüleme", value: overview.pageViews },
          { label: "Tekil Ziyaretçi", value: overview.uniqueVisitors },
          { label: "QR Menü Görüntüleme", value: overview.menuViews },
          { label: "Rezervasyon", value: overview.reservationCount },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-6 text-lg">En Çok Ziyaret Edilen Sayfalar</h2>
          {visitors.topPaths.length > 0 ? (
            <BarList
              items={visitors.topPaths.map((item) => ({
                label: item.path,
                value: item.count,
              }))}
            />
          ) : (
            <p className="text-sm text-white/35">Henüz ziyaret verisi yok.</p>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="mb-6 text-lg">Günlük Ziyaretçi Trendi</h2>
          {visitors.daily.length > 0 ? (
            <BarList
              items={visitors.daily.slice(-10).map((item) => ({
                label: item.date,
                value: item.uniqueVisitors,
              }))}
            />
          ) : (
            <p className="text-sm text-white/35">Trend verisi henüz oluşmadı.</p>
          )}
        </AdminCard>
      </div>

      <AdminSection title="Detay Raporlar" className="mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/analytics/orders", label: "Sipariş & Gelir" },
            { href: "/admin/analytics/products", label: "Ürün Performansı" },
            { href: "/admin/analytics/visitors", label: "Ziyaretçi Analizi" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 px-4 py-4 text-sm transition hover:bg-white/5"
            >
              {item.label} →
            </Link>
          ))}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
