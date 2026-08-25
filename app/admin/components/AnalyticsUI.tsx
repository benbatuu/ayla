export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string | number; hint?: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{item.label}</p>
          <p className="mt-3 font-brand text-3xl italic">{item.value}</p>
          {item.hint ? <p className="mt-2 text-xs text-white/35">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function BarList({
  items,
  valueKey = "value",
  labelKey = "label",
  formatValue,
}: {
  items: Array<Record<string, string | number>>;
  valueKey?: string;
  labelKey?: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = `${Math.max(4, (value / max) * 100)}%`;
        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-white/75">{item[labelKey]}</span>
              <span className="shrink-0 text-white/45">
                {formatValue ? formatValue(value) : value}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div className="h-2 rounded-full bg-[#f3f1eb]/70" style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RangeTabs({
  current,
  basePath,
}: {
  current: string;
  basePath: string;
}) {
  const ranges = [
    { id: "7d", label: "7 gün" },
    { id: "30d", label: "30 gün" },
    { id: "90d", label: "90 gün" },
    { id: "all", label: "Tümü" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <a
          key={range.id}
          href={`${basePath}?range=${range.id}`}
          className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
            current === range.id
              ? "bg-[#f3f1eb] text-[#171613]"
              : "border border-white/15 text-white/55 hover:bg-white/5"
          }`}
        >
          {range.label}
        </a>
      ))}
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.18em] text-white/35">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-white/5 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-white/70">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
