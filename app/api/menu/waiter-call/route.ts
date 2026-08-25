import { NextResponse } from "next/server";
import { z } from "zod";
import {
  billPaymentDetailsSchema,
  validateBillPaymentDetails,
} from "../../../lib/bill-payment";
import { PAYMENT_METHODS } from "../../../lib/payment-methods";
import { getTableByToken } from "../../../lib/qr-menu";
import { prisma } from "../../../lib/prisma";

const callSchema = z
  .object({
    token: z.string().min(1),
    type: z.enum(["waiter", "bill"]).default("waiter"),
    note: z.string().optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    paymentDetails: billPaymentDetailsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "bill" && !data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hesap isteği için ödeme yöntemi seçilmeli.",
        path: ["paymentMethod"],
      });
    }
    if (data.type === "waiter" && (data.paymentMethod || data.paymentDetails)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Garson çağrısında ödeme bilgisi gönderilemez.",
        path: ["paymentMethod"],
      });
    }
    if (data.type === "bill" && data.paymentMethod && data.paymentDetails) {
      const validated = validateBillPaymentDetails(
        data.paymentMethod,
        data.paymentDetails
      );
      if (!validated) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ödeme detayları geçersiz.",
          path: ["paymentDetails"],
        });
      }
      if (data.paymentMethod === "split" && !validated) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bölüşümlü ödeme için kişi sayısı ve ödeme dağılımı gerekli.",
          path: ["paymentDetails"],
        });
      }
    }
    if (data.type === "bill" && data.paymentMethod === "split" && !data.paymentDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bölüşümlü ödeme detayları gerekli.",
        path: ["paymentDetails"],
      });
    }
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = callSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const table = await getTableByToken(parsed.data.token);
    if (!table) {
      return NextResponse.json({ error: "Masa bulunamadı." }, { status: 404 });
    }

    const settings = await prisma.menuSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.callWaiterEnabled) {
      return NextResponse.json(
        { error: "Garson çağırma şu an kapalı." },
        { status: 403 }
      );
    }

    const recentPending = await prisma.waiterCall.findFirst({
      where: {
        tableId: table.id,
        type: parsed.data.type,
        status: "pending",
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });

    if (recentPending) {
      return NextResponse.json(
        { error: "İsteğiniz zaten iletildi.", id: recentPending.id },
        { status: 429 }
      );
    }

    const paymentDetails =
      parsed.data.type === "bill" && parsed.data.paymentDetails
        ? validateBillPaymentDetails(
            parsed.data.paymentMethod!,
            parsed.data.paymentDetails
          )
        : null;

    // Trust server-side open-check total; ignore client totalAmount for security
    let detailsPayload = paymentDetails;
    if (parsed.data.type === "bill" && detailsPayload) {
      const { getOpenBillTotalForTable } = await import("../../../lib/qr-menu");
      const serverTotal = await getOpenBillTotalForTable(table.id);
      detailsPayload = {
        ...detailsPayload,
        totalAmount: serverTotal,
        perPersonAmount:
          detailsPayload.splitCount && detailsPayload.splitCount > 0
            ? Math.round((serverTotal / detailsPayload.splitCount) * 100) / 100
            : detailsPayload.perPersonAmount,
      };
    }

    const call = await prisma.waiterCall.create({
      data: {
        tableId: table.id,
        type: parsed.data.type,
        note: parsed.data.note ?? null,
        paymentMethod:
          parsed.data.type === "bill" ? parsed.data.paymentMethod : null,
        paymentDetails: detailsPayload ?? undefined,
      },
    });

    return NextResponse.json({ success: true, id: call.id });
  } catch {
    return NextResponse.json({ error: "İstek gönderilemedi." }, { status: 500 });
  }
}
