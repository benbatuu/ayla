import { NextResponse } from "next/server";
import { z } from "zod";
import { getTableByToken } from "../../../lib/qr-menu";
import { prisma } from "../../../lib/prisma";

const feedbackSchema = z.object({
  token: z.string().min(1),
  type: z.enum(["suggestion", "complaint", "product_rating"]),
  message: z.string().min(2),
  menuItemId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz form." }, { status: 400 });
    }

    const table = await getTableByToken(parsed.data.token);

    const feedback = await prisma.menuFeedback.create({
      data: {
        tableId: table?.id ?? null,
        type: parsed.data.type,
        message: parsed.data.message,
        menuItemId: parsed.data.menuItemId ?? null,
        rating: parsed.data.rating ?? null,
        name: parsed.data.name ?? null,
        phone: parsed.data.phone ?? null,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch {
    return NextResponse.json({ error: "Gönderilemedi." }, { status: 500 });
  }
}
