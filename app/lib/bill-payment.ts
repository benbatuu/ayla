import { z } from "zod";

export const PORTION_METHODS = ["cash", "card"] as const;
export type PortionMethod = (typeof PORTION_METHODS)[number];

export const TIP_MODES = ["none", "percent", "custom"] as const;
export type TipMode = (typeof TIP_MODES)[number];

export type BillPaymentDetails = {
  totalAmount: number;
  splitCount?: number;
  perPersonAmount?: number;
  portions?: PortionMethod[];
  tip?: {
    mode: TipMode;
    percent?: number;
    amount?: number;
  };
};

export const portionMethodSchema = z.enum(PORTION_METHODS);
export const tipModeSchema = z.enum(TIP_MODES);

export const billPaymentDetailsSchema = z
  .object({
    totalAmount: z.number().min(0),
    splitCount: z.number().int().min(2).max(12).optional(),
    perPersonAmount: z.number().min(0).optional(),
    portions: z.array(portionMethodSchema).optional(),
    tip: z
      .object({
        mode: tipModeSchema,
        percent: z.number().min(0).max(100).optional(),
        amount: z.number().min(0).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tip?.mode === "percent" && data.tip.percent == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bahşiş yüzdesi gerekli.",
        path: ["tip", "percent"],
      });
    }
    if (data.tip?.mode === "custom" && data.tip.amount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bahşiş tutarı gerekli.",
        path: ["tip", "amount"],
      });
    }
  });

export function validateBillPaymentDetails(
  method: "cash" | "card" | "split",
  details: unknown
): BillPaymentDetails | null {
  const parsed = billPaymentDetailsSchema.safeParse(details);
  if (!parsed.success) return null;

  if (method === "split") {
    const { splitCount, perPersonAmount, portions } = parsed.data;
    if (!splitCount || perPersonAmount == null || !portions?.length) return null;
    if (portions.length !== splitCount) return null;
  }

  return parsed.data;
}

export function parseBillPaymentDetails(value: unknown): BillPaymentDetails | null {
  const parsed = billPaymentDetailsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function portionMethodLabel(method: PortionMethod): string {
  return method === "cash" ? "Nakit" : "Kart";
}

export function tipModeLabel(mode: TipMode): string {
  if (mode === "none") return "Bahşiş yok";
  if (mode === "percent") return "Yüzde";
  return "Özel tutar";
}

export function calculateTipAmount(
  totalAmount: number,
  tip?: BillPaymentDetails["tip"]
): number {
  if (!tip || tip.mode === "none") return 0;
  if (tip.mode === "percent" && tip.percent != null) {
    return Math.round((totalAmount * tip.percent) / 100);
  }
  if (tip.mode === "custom" && tip.amount != null) {
    return Math.round(tip.amount);
  }
  return 0;
}

export function formatBillPaymentSummary(
  method: "cash" | "card" | "split",
  details: BillPaymentDetails
): string[] {
  const lines: string[] = [];
  const totalLabel = `Adisyon: ₺${Math.round(details.totalAmount)}`;

  if (method === "split" && details.splitCount && details.perPersonAmount != null) {
    lines.push(
      `${details.splitCount} kişi · kişi başı ₺${Math.round(details.perPersonAmount)}`
    );
    if (details.portions?.length) {
      const cashCount = details.portions.filter((p) => p === "cash").length;
      const cardCount = details.portions.filter((p) => p === "card").length;
      const portionParts: string[] = [];
      if (cashCount) portionParts.push(`${cashCount} nakit`);
      if (cardCount) portionParts.push(`${cardCount} kart`);
      if (portionParts.length) lines.push(`Ödeme dağılımı: ${portionParts.join(", ")}`);

      details.portions.forEach((portion, index) => {
        lines.push(`Kişi ${index + 1}: ${portionMethodLabel(portion)}`);
      });
    }
  }

  lines.push(totalLabel);

  const tipAmount = calculateTipAmount(details.totalAmount, details.tip);
  if (details.tip && details.tip.mode !== "none") {
    if (details.tip.mode === "percent" && details.tip.percent != null) {
      lines.push(`Bahşiş: %${details.tip.percent} (₺${tipAmount})`);
    } else if (details.tip.mode === "custom") {
      lines.push(`Bahşiş: ₺${tipAmount}`);
    }
    lines.push(`Genel toplam: ₺${Math.round(details.totalAmount + tipAmount)}`);
  }

  return lines;
}

export function createDefaultSplitPortions(count: number): PortionMethod[] {
  return Array.from({ length: count }, () => "card" as PortionMethod);
}
