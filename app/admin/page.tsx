import Link from "next/link";
import AdminPageHeader, { AdminCard } from "./components/AdminPageHeader";
import AdminShell from "./components/AdminShell";
import { getAdminUser } from "./layout";
import { getAnalyticsOverview } from "../lib/analytics";
import { prisma } from "../lib/prisma";

export default async function AdminDashboardPage() {
  const user = await getAdminUser();

  const [analytics, reservationCount, pendingCount, menuCount, galleryCount, recentReservations] =
    await Promise.all([
      getAnalyticsOverview("30d"),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: "pending" } }),
      prisma.menuItem.count(),
      prisma.galleryItem.count(),
      prisma.reservation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const stats = [
    { label: "30g Gelir", value: analytics.formattedRevenue },
    { label: "30g Sipariş", value: analytics.orderCount },
    { label: "30g Ziyaretçi", value: analytics.uniqueVisitors },
    { label: "Bekleyen Rezervasyon", value: pendingCount },
  ];

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Dashboard"
        description="Ay'la web sitesini buradan yönetin."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminCard key={stat.label}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
              {stat.label}
            </p>
            <p className="mt-3 font-brand text-4xl italic">{stat.value}</p>
          </AdminCard>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg">Son Rezervasyonlar</h2>
            <Link href="/admin/reservations" className="text-xs text-white/40 hover:text-white">
              Tümünü gör →
            </Link>
          </div>
          <div className="space-y-4">
            {recentReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm">{reservation.name}</p>
                  <p className="text-xs text-white/40">
                    {reservation.guests} kişi · {reservation.time}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-wider">
                  {reservation.status}
                </span>
              </div>
            ))}
            {recentReservations.length === 0 ? (
              <p className="text-sm text-white/35">Henüz rezervasyon yok.</p>
            ) : null}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-6 text-lg">Hızlı Erişim</h2>
          <div className="grid gap-3">
            {[
              { href: "/admin/analytics", label: "Analitik raporları" },
              { href: "/admin/analytics/orders", label: "Sipariş & gelir detayı" },
              { href: "/admin/seo", label: "SEO ayarları" },
              { href: "/admin/marketing/campaigns", label: "Pazarlama kampanyaları" },
              { href: "/admin/menu", label: "Menü yönetimi" },
              { href: "/admin/service", label: "Servis & siparişler" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm transition hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/35">
            {menuCount} menü öğesi · {galleryCount} galeri öğesi · {reservationCount} toplam rezervasyon
          </p>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
