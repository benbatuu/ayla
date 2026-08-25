import Image from "next/image";
import AdminField from "../components/AdminField";
import AdminPageHeader, { AdminCard } from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import {
  createTableAction,
  deleteTableAction,
  regenerateTableTokenAction,
  updateTableAction,
} from "../actions";
import { getAdminUser } from "../layout";
import { generateTableQrDataUrl } from "../../lib/qr-code";
import { getMenuSettings, getMenuUrl } from "../../lib/qr-menu";
import { prisma } from "../../lib/prisma";

export default async function AdminTablesPage() {
  const user = await getAdminUser();
  const menuSettings = await getMenuSettings();

  const tables = await prisma.restaurantTable.findMany({
    orderBy: { number: "asc" },
  });

  const tablesWithQr = await Promise.all(
    tables.map(async (table) => ({
      ...table,
      qrDataUrl: await generateTableQrDataUrl(
        menuSettings.menuBaseUrl,
        table.qrToken
      ),
      menuUrl: getMenuUrl(menuSettings.menuBaseUrl, table.qrToken),
    }))
  );

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Masalar & QR Kodlar"
        description="Her masa için benzersiz QR kod üretin. Garson çağrıları ve siparişler masa numarasıyla eşleşir."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Toplam masa</p>
          <p className="mt-3 font-brand text-4xl italic">{tables.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Aktif</p>
          <p className="mt-3 font-brand text-4xl italic">
            {tables.filter((table) => table.active).length}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Menü URL tabanı</p>
          <p className="mt-3 truncate text-sm text-white/60">{menuSettings.menuBaseUrl}</p>
        </AdminCard>
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {tablesWithQr.map((table) => (
          <div
            key={table.id}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-brand text-4xl italic">Masa {table.number}</p>
                <p className="mt-1 text-sm text-white/45">
                  {table.zone}
                  {table.label ? ` · ${table.label}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
                  table.active ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/40"
                }`}
              >
                {table.active ? "Aktif" : "Pasif"}
              </span>
            </div>

            <div className="mx-auto mb-4 flex max-w-[220px] justify-center rounded-2xl bg-[#f3f1eb] p-4">
              <Image
                src={table.qrDataUrl}
                alt={`QR Masa ${table.number}`}
                width={200}
                height={200}
                unoptimized
              />
            </div>

            <p className="mb-4 break-all text-center text-[10px] text-white/35">{table.menuUrl}</p>

            <form action={updateTableAction.bind(null, table.id)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <AdminField label="No" name="number" type="number" defaultValue={table.number} />
                <AdminField label="Bölge" name="zone" defaultValue={table.zone} />
              </div>
              <AdminField label="Etiket" name="label" defaultValue={table.label ?? ""} />
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input type="checkbox" name="active" defaultChecked={table.active} />
                Aktif
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="submit" className="rounded-full bg-[#f3f1eb] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#171613]">
                  Kaydet
                </button>
                <button
                  formAction={regenerateTableTokenAction.bind(null, table.id)}
                  className="rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60"
                >
                  QR yenile
                </button>
                <button
                  formAction={deleteTableAction.bind(null, table.id)}
                  className="rounded-full border border-red-500/30 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-red-300"
                >
                  Sil
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>

      <form action={createTableAction} className="rounded-3xl border border-dashed border-white/15 p-6">
        <h2 className="mb-6 text-lg">Yeni Masa</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField label="Masa No" name="number" type="number" required />
          <AdminField label="Bölge" name="zone" defaultValue="Salon" />
          <AdminField label="Etiket (opsiyonel)" name="label" placeholder="Pencere kenarı" />
        </div>
        <button type="submit" className="mt-6 rounded-full bg-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.2em]">
          Masa Ekle
        </button>
      </form>
    </AdminShell>
  );
}
