import {
  calculateTipAmount,
  formatBillPaymentSummary,
  parseBillPaymentDetails,
  portionMethodLabel,
  type BillPaymentDetails,
} from "../../lib/bill-payment";
import type { PaymentMethod } from "../../lib/payment-methods";

export default function BillPaymentDetailsView({
  paymentMethod,
  paymentDetails,
}: {
  paymentMethod: PaymentMethod;
  paymentDetails: unknown;
}) {
  const details = parseBillPaymentDetails(paymentDetails);
  if (!details) return null;

  const summary = formatBillPaymentSummary(paymentMethod, details);
  const tipAmount = calculateTipAmount(details.totalAmount, details.tip);

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
      {paymentMethod === "split" && details.splitCount ? (
        <p className="text-white/70">
          {details.splitCount} kişi · kişi başı{" "}
          <span className="text-white">₺{Math.round(details.perPersonAmount ?? 0)}</span>
        </p>
      ) : null}

      {details.portions?.length ? (
        <ul className="space-y-1 text-xs text-white/55">
          {details.portions.map((portion, index) => (
            <li key={index} className="flex items-center justify-between gap-3">
              <span>
                {index + 1}. kişi
              </span>
              <span
                className={
                  portion === "cash"
                    ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200"
                    : "rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-200"
                }
              >
                {portionMethodLabel(portion)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="border-t border-white/10 pt-2 text-xs text-white/50">
        {summary.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {details.tip && details.tip.mode !== "none" && tipAmount > 0 ? (
          <p className="mt-1 font-medium text-white/75">
            Bahşiş dahil toplam: ₺{Math.round(details.totalAmount + tipAmount)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
