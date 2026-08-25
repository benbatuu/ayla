"use client";

import { useTransition } from "react";
import { updateWaiterCallStatusAction } from "../actions";

const OPTIONS = [
  { value: "pending", label: "Bekliyor" },
  { value: "preparing", label: "Hazırlanıyor" },
  { value: "served", label: "Servis edildi" },
  { value: "paid", label: "Hesap alındı" },
] as const;

export default function WaiterCallStatusSelect({
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
          await updateWaiterCallStatusAction(id, formData);
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
