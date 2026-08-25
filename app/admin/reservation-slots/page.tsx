import AdminField from "../components/AdminField";
import AdminPageHeader, { AdminCard, AdminSection } from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import {
  createReservationSlotAction,
  deleteReservationSlotAction,
  syncReservationSlotsAction,
  updateReservationSettingsAction,
  updateReservationSlotAction,
} from "../actions";
import { getAdminUser } from "../layout";
import { getSiteSettings } from "../../lib/content";
import {
  getAllReservationSlots,
  getReservationStatsForDate,
  toDateKey,
} from "../../lib/reservations";

export default async function AdminReservationSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; synced?: string; error?: string }>;
}) {
  const user = await getAdminUser();
  const settings = await getSiteSettings();
  const slots = await getAllReservationSlots();
  const todayKey = toDateKey(new Date());
  const todayStats = await getReservationStatsForDate(todayKey);
  const params = await searchParams;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Rezervasyon Saatleri"
        description="Saatleri, kapasite limitlerini ve doluluk kurallarını yönetin. Değişiklikler sitede anında yansır."
      />

      {params.saved === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Ayarlar kaydedildi.
        </div>
      ) : null}
      {params.synced === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Saatler açılış/kapanış ayarlarına göre güncellendi.
        </div>
      ) : null}
      {params.error === "1" ? (
        <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          İşlem başarısız. Lütfen alanları kontrol edin.
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            Bugünkü rezervasyon
          </p>
          <p className="mt-3 font-brand text-4xl italic">
            {todayStats.totalReservations}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            Bugünkü toplam kişi
          </p>
          <p className="mt-3 font-brand text-4xl italic">
            {todayStats.totalCovers}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            Aktif saat slotu
          </p>
          <p className="mt-3 font-brand text-4xl italic">
            {slots.filter((slot) => slot.enabled).length}
          </p>
        </AdminCard>
      </div>

      <form action={updateReservationSettingsAction} className="mb-10 space-y-8">
        <AdminSection title="Genel Kapasite Kuralları">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AdminField
              label="Tek rezervasyon max kişi"
              name="maxGuests"
              type="number"
              defaultValue={settings.maxGuests}
              hint="Bir rezervasyonda en fazla kaç kişi seçilebilir"
            />
            <AdminField
              label="Saat başına max kişi (cover)"
              name="maxCoversPerSlot"
              type="number"
              defaultValue={settings.maxCoversPerSlot ?? 24}
              hint="Aynı saatte toplam misafir limiti"
            />
            <AdminField
              label="Saat başına max rezervasyon"
              name="maxReservationsPerSlot"
              type="number"
              defaultValue={settings.maxReservationsPerSlot ?? 8}
              hint="Aynı saatte en fazla kaç ayrı masa/rezervasyon"
            />
          </div>
        </AdminSection>

        <AdminSection title="Saat Aralığı Şablonu">
          <p className="mb-5 text-sm text-white/45">
            Açılış, kapanış ve aralık değerlerini kaydedin; ardından saatleri
            otomatik oluşturun veya tek tek düzenleyin.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <AdminField label="Açılış" name="openTime" defaultValue={settings.openTime} />
            <AdminField label="Kapanış" name="closeTime" defaultValue={settings.closeTime} />
            <AdminField
              label="Aralık (dk)"
              name="timeSlotInterval"
              type="number"
              defaultValue={settings.timeSlotInterval}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-[#f3f1eb] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613] transition hover:bg-white"
            >
              Kuralları Kaydet
            </button>
          </div>
        </AdminSection>
      </form>

      <form action={syncReservationSlotsAction} className="mb-10">
        <button
          type="submit"
          className="rounded-full border border-white/15 px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Saatleri şablondan yeniden oluştur
        </button>
      </form>

      <AdminSection title="Saat Slotları">
        <div className="space-y-4">
          {slots.map((slot) => {
            const occupancy = todayStats.byTime[slot.time];

            return (
              <form
                key={slot.id}
                action={updateReservationSlotAction.bind(null, slot.id)}
                className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[100px_1fr_auto_auto_auto]"
              >
                <div>
                  <p className="font-brand text-3xl italic">{slot.time}</p>
                  <p className="mt-1 text-xs text-white/35">
                    Bugün: {occupancy?.count ?? 0} rez. / {occupancy?.covers ?? 0} kişi
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <AdminField
                    label="Sıra"
                    name="sortOrder"
                    type="number"
                    defaultValue={slot.sortOrder}
                  />
                  <AdminField
                    label="Max kişi (opsiyonel)"
                    name="maxCovers"
                    type="number"
                    defaultValue={slot.maxCovers ?? ""}
                    hint="Boş = genel limit"
                  />
                  <AdminField
                    label="Max rezervasyon (opsiyonel)"
                    name="maxBookings"
                    type="number"
                    defaultValue={slot.maxBookings ?? ""}
                    hint="Boş = genel limit"
                  />
                </div>

                <label className="flex items-center gap-2 self-center text-sm text-white/70">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={slot.enabled}
                    className="rounded border-white/20 bg-white/5"
                  />
                  Aktif
                </label>

                <div className="flex items-center gap-3 self-center">
                  <button
                    type="submit"
                    className="rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-wider hover:bg-white/15"
                  >
                    Kaydet
                  </button>
                  <button
                    formAction={deleteReservationSlotAction.bind(null, slot.id)}
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    Sil
                  </button>
                </div>
              </form>
            );
          })}

          {slots.length === 0 ? (
            <p className="text-sm text-white/40">
              Henüz saat tanımlı değil. Şablondan oluşturun veya manuel ekleyin.
            </p>
          ) : null}
        </div>

        <form action={createReservationSlotAction} className="mt-8 flex flex-wrap items-end gap-4 border-t border-white/10 pt-8">
          <div className="min-w-[140px] flex-1">
            <AdminField label="Yeni saat (HH:MM)" name="time" placeholder="19:30" required />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[#f3f1eb] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613]"
          >
            Saat Ekle
          </button>
        </form>
      </AdminSection>
    </AdminShell>
  );
}
