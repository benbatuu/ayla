import AdminField from "../components/AdminField";
import AdminImageUpload from "../components/AdminImageUpload";
import AdminPageHeader, { AdminSection } from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import { updateMenuSettingsAction } from "../actions";
import { getAdminUser } from "../layout";
import { getMenuSettings } from "../../lib/qr-menu";

export default async function AdminMenuSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getAdminUser();
  const settings = await getMenuSettings();
  const params = await searchParams;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="QR Menü Ayarları"
        description="Wi-Fi bilgileri, karşılama metinleri, sipariş ve garson çağırma seçenekleri."
      />

      {params.saved === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Ayarlar kaydedildi.
        </div>
      ) : null}

      <form action={updateMenuSettingsAction} className="space-y-8">
        <AdminSection title="Genel">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminImageUpload
              name="menuLogoUrl"
              label="Menü Logosu"
              defaultUrl={settings.menuLogoUrl}
              folder="menu"
              fileName="logo"
              hint="uploads/menu/logo.webp"
            />
            <AdminField
              label="Menü subdomain / taban URL"
              name="menuBaseUrl"
              defaultValue={settings.menuBaseUrl}
              hint="Örn: https://menu.ayla.restaurant veya http://menu.localhost:3000"
            />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <AdminField label="Karşılama (TR)" name="welcomeMessageTr" defaultValue={settings.welcomeMessageTr} textarea />
            <AdminField label="Welcome (EN)" name="welcomeMessageEn" defaultValue={settings.welcomeMessageEn} textarea />
            <AdminField label="Приветствие (RU)" name="welcomeMessageRu" defaultValue={settings.welcomeMessageRu} textarea />
          </div>
        </AdminSection>

        <AdminSection title="Wi-Fi">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="SSID" name="wifiSsid" defaultValue={settings.wifiSsid} />
            <AdminField label="Şifre" name="wifiPassword" defaultValue={settings.wifiPassword} />
          </div>
        </AdminSection>

        <AdminSection title="Özellikler">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" name="callWaiterEnabled" defaultChecked={settings.callWaiterEnabled} />
              Garson çağır
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" name="orderingEnabled" defaultChecked={settings.orderingEnabled} />
              Sipariş ver
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" name="showImages" defaultChecked={settings.showImages} />
              Görselleri göster
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" name="showPrices" defaultChecked={settings.showPrices} />
              Fiyatları göster
            </label>
          </div>
        </AdminSection>

        <button
          type="submit"
          className="rounded-full bg-[#f3f1eb] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
        >
          Kaydet
        </button>
      </form>
    </AdminShell>
  );
}
