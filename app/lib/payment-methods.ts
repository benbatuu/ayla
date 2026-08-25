export const PAYMENT_METHODS = ["cash", "card", "split"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Nakit",
  card: "Kart / Kredi Kartı",
  split: "Bölüşümlü Ödeme",
};

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

export function paymentMethodBadgeClass(method: PaymentMethod): string {
  if (method === "cash") return "bg-emerald-500/15 text-emerald-200";
  if (method === "card") return "bg-sky-500/15 text-sky-200";
  return "bg-amber-500/15 text-amber-200";
}
