import { prisma } from "./prisma";
import { generateTimeSlots } from "./content";
import type { SlotAvailability } from "./reservation-types";
export type { SlotAvailability } from "./reservation-types";
export { toDateKey } from "./reservation-types";
import { toDateKey } from "./reservation-types";

export const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed"] as const;
export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "no_show",
  "completed",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Max days ahead a guest can book (inclusive of today = 0). */
export const MAX_RESERVATION_DAYS_AHEAD = 7;
/** Parties larger than this must call by phone. */
export const LARGE_PARTY_PHONE_THRESHOLD = 8;

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function isValidReservationStatus(
  value: string
): value is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

/** Minutes from service-day start; early-morning times after overnight close are +24h. */
export function serviceDayMinutes(
  time: string,
  openTime: string,
  closeTime: string
): number {
  const [h, m] = time.split(":").map(Number);
  const [oH, oM] = openTime.split(":").map(Number);
  const [cH, cM] = closeTime.split(":").map(Number);
  const openMins = oH * 60 + oM;
  const closeMins = cH * 60 + cM;
  let mins = h * 60 + m;
  const overnight = closeMins <= openMins;
  if (overnight && mins < openMins) {
    mins += 24 * 60;
  }
  return mins;
}

export function slotAbsoluteDate(
  dateKey: string,
  time: string,
  openTime: string,
  closeTime: string
): Date {
  const [h, m] = time.split(":").map(Number);
  const base = parseDateKey(dateKey);
  const mins = serviceDayMinutes(time, openTime, closeTime);
  const dayOffset = mins >= 24 * 60 ? 1 : 0;
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

export function isSlotPastForDate(
  dateKey: string,
  time: string,
  openTime = "10:00",
  closeTime = "01:00"
): boolean {
  const slotAt = slotAbsoluteDate(dateKey, time, openTime, closeTime);
  return slotAt.getTime() <= Date.now();
}

export function isDateKeyInBookingWindow(
  dateKey: string,
  maxDaysAhead = MAX_RESERVATION_DAYS_AHEAD
): boolean {
  const today = toDateKey(new Date());
  if (dateKey < today) return false;
  const max = new Date();
  max.setHours(12, 0, 0, 0);
  max.setDate(max.getDate() + maxDaysAhead);
  const maxKey = toDateKey(max);
  return dateKey <= maxKey;
}

export async function getReservationSlots() {
  return prisma.reservationSlot.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllReservationSlots() {
  return prisma.reservationSlot.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function syncReservationSlotsFromSettings() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    return [];
  }

  const times = generateTimeSlots(
    settings.openTime,
    settings.closeTime,
    settings.timeSlotInterval
  );

  const existing = await prisma.reservationSlot.findMany();
  const existingByTime = new Map(existing.map((slot) => [slot.time, slot]));
  const keep = new Set(times);

  for (let index = 0; index < times.length; index++) {
    const time = times[index];
    const current = existingByTime.get(time);

    if (current) {
      // Preserve manual enabled=false; only update sort order
      await prisma.reservationSlot.update({
        where: { id: current.id },
        data: { sortOrder: index },
      });
    } else {
      await prisma.reservationSlot.create({
        data: { time, sortOrder: index, enabled: true },
      });
    }
  }

  // Disable slots no longer in the template (do not delete — history safety)
  for (const slot of existing) {
    if (!keep.has(slot.time) && slot.enabled) {
      await prisma.reservationSlot.update({
        where: { id: slot.id },
        data: { enabled: false },
      });
    }
  }

  return getAllReservationSlots();
}

export async function getAvailabilityForDate(dateKey: string) {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  const openTime = settings?.openTime ?? "10:00";
  const closeTime = settings?.closeTime ?? "01:00";
  const defaultMaxCovers = settings?.maxCoversPerSlot ?? 24;
  const defaultMaxBookings = settings?.maxReservationsPerSlot ?? 8;

  const maxDays = settings?.maxReservationDaysAhead ?? MAX_RESERVATION_DAYS_AHEAD;

  if (!isDateKeyInBookingWindow(dateKey, maxDays)) {
    return [] as SlotAvailability[];
  }

  const slots = await getReservationSlots();

  const reservations = await prisma.reservation.findMany({
    where: {
      dateKey,
      status: { in: [...ACTIVE_RESERVATION_STATUSES] },
    },
    select: { time: true, guests: true },
  });

  const byTime = new Map<string, { covers: number; count: number }>();

  for (const reservation of reservations) {
    const current = byTime.get(reservation.time) ?? { covers: 0, count: 0 };
    current.covers += reservation.guests;
    current.count += 1;
    byTime.set(reservation.time, current);
  }

  return slots.map((slot) => {
    const booked = byTime.get(slot.time) ?? { covers: 0, count: 0 };
    const maxCovers = slot.maxCovers ?? defaultMaxCovers;
    const maxBookings = slot.maxBookings ?? defaultMaxBookings;
    const remainingCovers = Math.max(0, maxCovers - booked.covers);
    const remainingBookings = Math.max(0, maxBookings - booked.count);
    const isPast = isSlotPastForDate(dateKey, slot.time, openTime, closeTime);

    return {
      time: slot.time,
      maxCovers,
      maxBookings,
      bookedCovers: booked.covers,
      bookedCount: booked.count,
      remainingCovers,
      remainingBookings,
      isAvailable: !isPast && remainingCovers > 0 && remainingBookings > 0,
      isPast,
    } satisfies SlotAvailability;
  });
}

export async function createReservationAtomic(input: {
  guests: number;
  dateKey: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  note?: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      const settings = await tx.siteSettings.findUnique({
        where: { id: "default" },
      });

      const openTime = settings?.openTime ?? "10:00";
      const closeTime = settings?.closeTime ?? "01:00";
      const maxGuests = settings?.maxGuests ?? 12;
      const defaultMaxCovers = settings?.maxCoversPerSlot ?? 24;
      const defaultMaxBookings = settings?.maxReservationsPerSlot ?? 8;
      const phoneThreshold =
        settings?.largePartyPhoneThreshold ?? LARGE_PARTY_PHONE_THRESHOLD;
      const maxDays =
        settings?.maxReservationDaysAhead ?? MAX_RESERVATION_DAYS_AHEAD;

      if (!isDateKeyInBookingWindow(input.dateKey, maxDays)) {
        throw new ReservationError(
          "DATE_OUT_OF_RANGE",
          `Rezervasyon en fazla ${maxDays} gün sonrası için alınır.`
        );
      }

      if (input.guests > phoneThreshold) {
        throw new ReservationError(
          "LARGE_PARTY",
          `Bu kişi sayısı için lütfen telefonla arayın.`
        );
      }

      if (input.guests > maxGuests) {
        throw new ReservationError(
          "MAX_GUESTS",
          "Maksimum misafir sayısı aşıldı."
        );
      }

      if (isSlotPastForDate(input.dateKey, input.time, openTime, closeTime)) {
        throw new ReservationError("SLOT_PAST", "Seçilen saat geçmiş.");
      }

      const slot = await tx.reservationSlot.findFirst({
        where: { time: input.time, enabled: true },
      });

      if (!slot) {
        throw new ReservationError("SLOT_DISABLED", "Seçilen saat müsait değil.");
      }

      const maxCovers = slot.maxCovers ?? defaultMaxCovers;
      const maxBookings = slot.maxBookings ?? defaultMaxBookings;

      // Aggregate capacity inside the transaction to reduce TOCTOU races
      const existing = await tx.reservation.findMany({
        where: {
          dateKey: input.dateKey,
          time: input.time,
          status: { in: [...ACTIVE_RESERVATION_STATUSES] },
        },
        select: { guests: true },
      });

      const bookedCovers = existing.reduce((sum, item) => sum + item.guests, 0);
      const bookedCount = existing.length;

      if (bookedCovers + input.guests > maxCovers) {
        throw new ReservationError(
          "SLOT_FULL",
          "Bu saat için yeterli kapasite kalmadı."
        );
      }

      if (bookedCount + 1 > maxBookings) {
        throw new ReservationError(
          "SLOT_FULL",
          "Bu saat için rezervasyon limiti doldu."
        );
      }

      return tx.reservation.create({
        data: {
          guests: input.guests,
          date: parseDateKey(input.dateKey),
          dateKey: input.dateKey,
          time: input.time,
          name: input.name,
          phone: input.phone,
          email: input.email,
          note: input.note ?? null,
          status: "pending",
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

export class ReservationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function getReservationStatsForDate(dateKey: string) {
  const reservations = await prisma.reservation.findMany({
    where: {
      dateKey,
      status: { in: [...ACTIVE_RESERVATION_STATUSES] },
    },
    select: { guests: true, time: true },
  });

  return {
    totalReservations: reservations.length,
    totalCovers: reservations.reduce((sum, item) => sum + item.guests, 0),
    byTime: reservations.reduce<
      Record<string, { count: number; covers: number }>
    >((acc, item) => {
      const current = acc[item.time] ?? { count: 0, covers: 0 };
      current.count += 1;
      current.covers += item.guests;
      acc[item.time] = current;
      return acc;
    }, {}),
  };
}
