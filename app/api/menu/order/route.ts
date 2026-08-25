import { NextResponse } from "next/server";
import { z } from "zod";
import { getTableByToken } from "../../../lib/qr-menu";
import { prisma } from "../../../lib/prisma";
import { clientIp, rateLimit } from "../../../lib/rate-limit";

const orderSchema = z.object({
  token: z.string().min(1),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.coerce.number().min(1).max(20),
        note: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz sipariş." }, { status: 400 });
    }

    const limited = rateLimit(`order:${parsed.data.token}:${clientIp(request)}`, {
      limit: 12,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Çok fazla sipariş. Lütfen bir dakika bekleyin." },
        { status: 429 }
      );
    }

    const table = await getTableByToken(parsed.data.token);
    if (!table) {
      return NextResponse.json({ error: "Masa bulunamadı." }, { status: 404 });
    }

    const settings = await prisma.menuSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.orderingEnabled) {
      return NextResponse.json(
        { error: "Sipariş verme şu an kapalı." },
        { status: 403 }
      );
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: parsed.data.items.map((item) => item.menuItemId) },
        published: true,
      },
      include: { translations: { where: { locale: "tr" } } },
    });

    if (menuItems.length !== parsed.data.items.length) {
      return NextResponse.json(
        { error: "Bazı ürünler artık mevcut değil." },
        { status: 400 }
      );
    }

    const itemMap = new Map(menuItems.map((item) => [item.id, item]));

    const order = await prisma.tableOrder.create({
      data: {
        tableId: table.id,
        note: parsed.data.note ?? null,
        items: {
          create: parsed.data.items.map((line) => {
            const menuItem = itemMap.get(line.menuItemId)!;
            const translation = menuItem.translations[0];
            return {
              menuItemId: menuItem.id,
              quantity: line.quantity,
              unitPrice: menuItem.price,
              nameSnapshot: translation?.name ?? "Ürün",
              note: line.note ?? null,
            };
          }),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, id: order.id });
  } catch {
    return NextResponse.json({ error: "Sipariş kaydedilemedi." }, { status: 500 });
  }
}
