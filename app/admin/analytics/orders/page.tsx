import AdminPageHeader, { AdminCard, AdminSection } from "../../components/AdminPageHeader";
import { BarList, DataTable, RangeTabs, StatGrid } from "../../components/AnalyticsUI";
import AdminShell from "../../components/AdminShell";
import { getAdminUser } from "../../layout";
import { formatCurrency, getOrderAnalytics, getAnalyticsOverview } from "../../../lib/analytics";
import type { DateRange } from "../../../lib/analytics";

export default async function AnalyticsOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getAdminUser();
  const { range: rawRange } = await searchParams;
  const range = (["7d", "30d", "90d", "all"].includes(rawRange ?? "")
    ? rawRange
    : "30d") as DateRange;

  const [overview, data] = await Promise.all([
    getAnalyticsOverview(range),
    getOrderAnalytics(range),
  ]);

  const statusLabels: Record<string, string> = {
    pending: "Yeni",
    preparing: "Hazırlanıyor",
    served: "Servis edildi",
    cancelled: "İptal",
  };

  return (
    <AdminShell user={user} wide>
      <AdminPageHeader
        title="Sipariş & Gelir"
        description="Masa bazlı sipariş hacmi, gelir dağılımı ve sipariş detayları."
      />

      <div className="mb-8">
        <RangeTabs current={range} basePath="/admin/analytics/orders" />
      </div>

      <StatGrid
        items={[
          { label: "Toplam Gelir", value: overview.formattedRevenue },
          { label: "Bekleyen Gelir", value: overview.formattedPipeline },
          { label: "Sipariş Sayısı", value: overview.orderCount },
          { label: "Servis Edilen", value: overview.servedCount },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-6 text-lg">Duruma Göre Siparişler</h2>
          <BarList
            items={Object.entries(data.byStatus).map(([status, value]) => ({
              label: statusLabels[status] ?? status,
              value,
            }))}
          />
        </AdminCard>

        <AdminCard>
          <h2 className="mb-6 text-lg">Günlük Gelir</h2>
          {data.daily.length > 0 ? (
            <BarList
              items={data.daily.slice(-10).map((item) => ({
                label: item.date,
                value: item.revenue,
              }))}
              formatValue={(value) => formatCurrency(value)}
            />
          ) : (
            <p className="text-sm text-white/35">Gelir verisi yok.</p>
          )}
        </AdminCard>
      </div>

      <AdminSection title="Masa Performansı" className="mt-8">
        {data.byTable.length > 0 ? (
          <DataTable
            headers={["Masa", "Bölge", "Sipariş", "Gelir"]}
            rows={data.byTable.map((table) => [
              table.tableNumber,
              table.zone,
              table.orders,
              formatCurrency(table.revenue),
            ])}
          />
        ) : (
          <p className="text-sm text-white/35">Masa verisi yok.</p>
        )}
      </AdminSection>

      <AdminSection title="Sipariş Detayları" className="mt-8">
        {data.orders.length > 0 ? (
          <div className="space-y-4">
            {data.orders.slice(0, 25).map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      Masa {order.tableNumber} · {order.zone}
                    </p>
                    <p className="text-xs text-white/40">
                      {order.createdAt.toLocaleString("tr-TR")} · {statusLabels[order.status] ?? order.status}
                    </p>
                  </div>
                  <p className="font-brand text-2xl italic">{order.formattedTotal}</p>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-white/65">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.quantity}x {item.name} — {formatCurrency(item.lineTotal)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/35">Sipariş bulunamadı.</p>
        )}
      </AdminSection>
    </AdminShell>
  );
}
