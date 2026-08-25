import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailabilityForDate } from "../../../lib/reservations";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      date: searchParams.get("date"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz tarih formatı." },
        { status: 400 }
      );
    }

    const slots = await getAvailabilityForDate(parsed.data.date);
    const availableSlots = slots.filter((slot) => slot.isAvailable);

    return NextResponse.json({
      date: parsed.data.date,
      slots,
      availableCount: availableSlots.length,
      totalBookedCovers: slots.reduce((sum, slot) => sum + slot.bookedCovers, 0),
      totalBookedReservations: slots.reduce(
        (sum, slot) => sum + slot.bookedCount,
        0
      ),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Müsaitlik bilgisi alınamadı." },
      { status: 500 }
    );
  }
}
