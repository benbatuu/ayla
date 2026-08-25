import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createReservationAtomic,
  LARGE_PARTY_PHONE_THRESHOLD,
  ReservationError,
} from "../../lib/reservations";
import { notifyReservationCreated } from "../../lib/notify";
import { clientIp, rateLimit } from "../../lib/rate-limit";
import { getSiteSettings } from "../../lib/content";

const reservationSchema = z.object({
  guests: z.coerce.number().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().max(200),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`reservation:${ip}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.",
          code: "RATE_LIMIT",
          retryAfterSec: limited.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = reservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz rezervasyon verisi.", code: "INVALID" },
        { status: 400 }
      );
    }

    const settings = await getSiteSettings();
    const phoneThreshold =
      settings.largePartyPhoneThreshold ?? LARGE_PARTY_PHONE_THRESHOLD;

    if (parsed.data.guests > phoneThreshold) {
      return NextResponse.json(
        {
          error: `Bu kişi sayısı için lütfen bizi arayın: ${settings.phone}`,
          code: "LARGE_PARTY",
          phone: settings.phone,
        },
        { status: 400 }
      );
    }

    const reservation = await createReservationAtomic({
      guests: parsed.data.guests,
      dateKey: parsed.data.date,
      time: parsed.data.time,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      note: parsed.data.note,
    });

    void notifyReservationCreated({
      reservationId: reservation.id,
      name: reservation.name,
      phone: reservation.phone,
      email: reservation.email,
      dateKey: reservation.dateKey,
      time: reservation.time,
      guests: reservation.guests,
      phoneDisplay: settings.phone,
    });

    return NextResponse.json({
      success: true,
      id: reservation.id,
      reference: reservation.id.slice(0, 8).toUpperCase(),
      status: reservation.status,
    });
  } catch (error) {
    if (error instanceof ReservationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "SLOT_FULL" ? 409 : 400 }
      );
    }

    console.error("reservation POST", error);
    return NextResponse.json(
      { error: "Rezervasyon kaydedilemedi.", code: "SERVER" },
      { status: 500 }
    );
  }
}
