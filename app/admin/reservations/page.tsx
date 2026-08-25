import AdminShell from "../components/AdminShell";
import AdminPageHeader from "../components/AdminPageHeader";
import { deleteReservationAction } from "../actions";
import { getAdminUser } from "../layout";
import { prisma } from "../../lib/prisma";
import { toDateKey } from "../../lib/reservation-types";
import ReservationStatusSelect from "./ReservationStatusSelect";
import Link from "next/link";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getAdminUser();
  const params = await searchParams;
  const todayKey = toDateKey(new Date());
  const dateFilter = params.date === "all" ? null : params.date || todayKey;

  const reservations = await prisma.reservation.findMany({
    where: dateFilter ? { dateKey: dateFilter } : undefined,
    orderBy: [{ dateKey: "asc" }, { time: "asc" }],
  });

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Rezervasyonlar"
        description="Gelen rezervasyonları görüntüleyin ve yönetin."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-xs">
        <Link
          href="/admin/reservations"
          className={`rounded-full px-4 py-2 ${
            dateFilter === todayKey
              ? "bg-white text-black"
              : "border border-white/15 text-white/60"
          }`}
        >
          Bugün
        </Link>
        <Link
          href="/admin/reservations?date=all"
          className={`rounded-full px-4 py-2 ${
            !dateFilter ? "bg-white text-black" : "border border-white/15 text-white/60"
          }`}
        >
          Tümü
        </Link>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.2em] text-white/35">
            <tr>
              <th className="px-4 py-4">Misafir</th>
              <th className="px-4 py-4">Tarih</th>
              <th className="px-4 py-4">Saat</th>
              <th className="px-4 py-4">Kişi</th>
              <th className="px-4 py-4">İletişim</th>
              <th className="px-4 py-4">Durum</th>
              <th className="px-4 py-4">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="border-t border-white/10">
                <td className="px-4 py-4">
                  <p>{reservation.name}</p>
                  {reservation.note ? (
                    <p className="mt-1 text-xs text-white/35">{reservation.note}</p>
                  ) : null}
                </td>
                <td className="px-4 py-4">{reservation.dateKey}</td>
                <td className="px-4 py-4">{reservation.time}</td>
                <td className="px-4 py-4">{reservation.guests}</td>
                <td className="px-4 py-4">
                  <p>{reservation.phone}</p>
                  <p className="text-xs text-white/35">{reservation.email}</p>
                </td>
                <td className="px-4 py-4">
                  <ReservationStatusSelect
                    id={reservation.id}
                    status={reservation.status}
                  />
                </td>
                <td className="px-4 py-4">
                  <form action={deleteReservationAction.bind(null, reservation.id)}>
                    <ConfirmDeleteButton label="Sil" message="Bu rezervasyonu silmek istediğinize emin misiniz?" />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reservations.length === 0 ? (
          <p className="p-8 text-sm text-white/35">Bu filtrede rezervasyon yok.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
