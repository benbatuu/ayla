import AdminPageHeader from "../components/AdminPageHeader";
import AdminShell from "../components/AdminShell";
import { getAdminUser } from "../layout";
import {
  isPaymentMethod,
  paymentMethodBadgeClass,
  paymentMethodLabels,
} from "../../lib/payment-methods";
import {
  getPendingServiceRequests,
  getServiceHistory,
} from "../../lib/qr-menu";
import OrderStatusSelect from "./OrderStatusSelect";
import ServiceLiveRefresh from "./ServiceLiveRefresh";
import WaiterCallStatusSelect from "./WaiterCallStatusSelect";
import BillPaymentDetailsView from "./BillPaymentDetailsView";

export const dynamic = "force-dynamic";

function callTypeLabel(type: string) {
  if (type === "bill") return "Hesap tercihi";
  return "Garson";
}

export default async function AdminServicePage() {
  const user = await getAdminUser();
  const [{ waiterCalls, orders }, history] = await Promise.all([
    getPendingServiceRequests(),
    getServiceHistory(30),
  ]);
  const pendingCount = waiterCalls.length + orders.length;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Servis & Siparişler"
        description="Garson çağrıları ve hesap tercihleri (ödeme masada alınır). “Hesap alındı” adisyonu sıfırlar."
      />

      <ServiceLiveRefresh pendingCount={pendingCount} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-6 text-lg">Aktif istekler</h2>
          <div className="space-y-4">
            {waiterCalls.map((call) => (
              <div key={call.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-brand text-2xl italic">
                        Masa {call.table.number}
                      </p>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/70">
                        {callTypeLabel(call.type)}
                      </span>
                      {call.paymentMethod && isPaymentMethod(call.paymentMethod) ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${paymentMethodBadgeClass(call.paymentMethod)}`}
                        >
                          {paymentMethodLabels[call.paymentMethod]}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      {call.table.zone} · {call.createdAt.toLocaleString("tr-TR")}
                    </p>
                    {call.type === "bill" ? (
                      <p className="mt-2 text-xs text-amber-200/70">
                        Misafir ödeme tercihini bildirdi — tahsilatı masada siz yapın. Bitince
                        “Hesap alındı” seçin.
                      </p>
                    ) : null}
                    {call.note ? (
                      <p className="mt-2 text-sm text-white/55">{call.note}</p>
                    ) : null}
                    {call.paymentDetails && call.paymentMethod ? (
                      <BillPaymentDetailsView
                        paymentMethod={call.paymentMethod as "cash" | "card" | "split"}
                        paymentDetails={call.paymentDetails}
                      />
                    ) : null}
                  </div>
                  <WaiterCallStatusSelect id={call.id} status={call.status} />
                </div>
              </div>
            ))}
            {waiterCalls.length === 0 ? (
              <p className="text-sm text-white/35">Bekleyen garson veya hesap isteği yok.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-6 text-lg">Aktif siparişler</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-brand text-2xl italic">Masa {order.table.number}</p>
                    <p className="text-xs text-white/40">
                      {order.table.zone} · {order.createdAt.toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <OrderStatusSelect id={order.id} status={order.status} />
                </div>
                <ul className="space-y-1 text-sm text-white/70">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.nameSnapshot}
                      {item.note ? ` (${item.note})` : ""}
                    </li>
                  ))}
                </ul>
                {order.note ? (
                  <p className="mt-2 text-xs text-white/40">Not: {order.note}</p>
                ) : null}
              </div>
            ))}
            {orders.length === 0 ? (
              <p className="text-sm text-white/35">Aktif sipariş yok.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-lg">Son tamamlananlar</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {history.waiterCalls.slice(0, 12).map((call) => (
            <div
              key={call.id}
              className="rounded-xl border border-white/5 px-4 py-3 text-sm text-white/45"
            >
              Masa {call.table.number} · {callTypeLabel(call.type)} · {call.status} ·{" "}
              {call.updatedAt.toLocaleString("tr-TR")}
            </div>
          ))}
          {history.orders.slice(0, 12).map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-white/5 px-4 py-3 text-sm text-white/45"
            >
              Masa {order.table.number} · sipariş · {order.status} ·{" "}
              {order.updatedAt.toLocaleString("tr-TR")}
            </div>
          ))}
          {history.waiterCalls.length === 0 && history.orders.length === 0 ? (
            <p className="text-sm text-white/35">Henüz geçmiş kayıt yok.</p>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
