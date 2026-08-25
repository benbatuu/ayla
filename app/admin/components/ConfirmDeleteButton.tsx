"use client";

export default function ConfirmDeleteButton({
  label = "Sil",
  message = "Bu işlemi geri alamazsınız. Emin misiniz?",
  className = "text-xs text-red-300 hover:text-red-200",
}: {
  label?: string;
  message?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}
