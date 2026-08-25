import AdminPageHeader, { AdminCard, AdminSection } from "../../components/AdminPageHeader";
import { BarList, DataTable, RangeTabs } from "../../components/AnalyticsUI";
import AdminShell from "../../components/AdminShell";
import { getAdminUser } from "../../layout";
import { getProductAnalytics } from "../../../lib/analytics";
import type { DateRange } from "../../../lib/analytics";

export default async function AnalyticsProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getAdminUser();
  const { range: rawRange } = await searchParams;
  const range = (["7d", "30d", "90d", "all"].includes(rawRange ?? "")
    ? rawRange
    : "30d") as DateRange;

  const data = await getProductAnalytics(range);

  return (
    <AdminShell user={user} wide>
      <AdminPageHeader
        title="Ürün Performansı"
        description="En çok sipariş edilen ürünler, kategori bazlı gelir ve adet analizi."
      />

      <div className="mb-8">
        <RangeTabs current={range} basePath="/admin/analytics/products" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-6 text-lg">En Çok Satan Ürünler</h2>
          {data.products.length > 0 ? (
            <BarList
              items={data.products.slice(0, 10).map((product) => ({
                label: product.name,
                value: product.quantity,
              }))}
            />
          ) : (
            <p className="text-sm text-white/35">Ürün sipariş verisi yok.</p>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="mb-6 text-lg">Kategori Geliri</h2>
          {data.byCategory.length > 0 ? (
            <BarList
              items={data.byCategory.map((category) => ({
                label: category.category,
                value: category.revenue,
              }))}
              formatValue={(value) =>
                new Intl.NumberFormat("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
          ) : (
            <p className="text-sm text-white/35">Kategori verisi yok.</p>
          )}
        </AdminCard>
      </div>

      <AdminSection title="Ürün Detay Tablosu" className="mt-8">
        {data.products.length > 0 ? (
          <DataTable
            headers={["Ürün", "Kategori", "Adet", "Sipariş", "Gelir"]}
            rows={data.products.map((product) => [
              product.name,
              product.category,
              product.quantity,
              product.orders,
              product.formattedRevenue,
            ])}
          />
        ) : (
          <p className="text-sm text-white/35">Henüz ürün performans verisi yok.</p>
        )}
      </AdminSection>
    </AdminShell>
  );
}
