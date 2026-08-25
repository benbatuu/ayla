export type SlotAvailability = {
  time: string;
  maxCovers: number;
  maxBookings: number;
  bookedCovers: number;
  bookedCount: number;
  remainingCovers: number;
  remainingBookings: number;
  isAvailable: boolean;
  isPast: boolean;
};

export type AvailabilityResponse = {
  date: string;
  slots: SlotAvailability[];
  availableCount: number;
  totalBookedCovers: number;
  totalBookedReservations: number;
  updatedAt: string;
};

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
