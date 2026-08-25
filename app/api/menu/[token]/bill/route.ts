import { NextResponse } from "next/server";
import { getTableByToken } from "../../../../lib/qr-menu";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const table = await getTableByToken(token);

    if (!table) {
      return NextResponse.json({ error: "Masa bulunamadı." }, { status: 404 });
    }

    const orders = await prisma.tableOrder.findMany({
      where: {
        tableId: table.id,
        status: { in: ["pending", "preparing", "served"] },
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 20,
    });

    const lines = orders.flatMap((order) =>
      order.items.map((item) => ({
        name: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        note: item.note,
        orderStatus: order.status,
        createdAt: order.createdAt,
      }))
    );

    return NextResponse.json({
      table: { number: table.number, zone: table.zone },
      lines,
      orderCount: orders.length,
    });
  } catch {
    return NextResponse.json({ error: "Adisyon yüklenemedi." }, { status: 500 });
  }
}
