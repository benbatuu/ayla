"use client";

import { useTransition } from "react";
import { updateReservationStatusAction } from "../actions";

const OPTIONS = [
  { value: "pending", label: "Beklemede" },
  { value: "confirmed", label: "Onaylandı" },
  { value: "cancelled", label: "İptal" },
  { value: "no_show", label: "Gelmedi" },
  { value: "completed", label: "Tamamlandı" },
] as const;

export default function ReservationStatusSelect({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(event) => {
        const formData = new FormData();
        formData.set("status", event.target.value);
        startTransition(async () => {
          await updateReservationStatusAction(id, formData);
        });
      }}
      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs disabled:opacity-50"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
