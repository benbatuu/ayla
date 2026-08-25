export function parsePrice(value: string | null | undefined): number {
  if (!value) return 0;

  const cleaned = value.replace(/[^\d,.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);

  return Number.isFinite(num) ? num : 0;
}

export function formatCurrency(value: number, locale = "tr-TR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}
