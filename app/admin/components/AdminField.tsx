export default function AdminField({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  textarea = false,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-white/30"
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-white/30"
        />
      )}
      {hint ? <span className="mt-1 block text-xs text-white/30">{hint}</span> : null}
    </label>
  );
}
