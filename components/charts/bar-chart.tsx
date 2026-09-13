// A plain div-based horizontal bar chart - no charting library needed for
// a handful of straightforward comparisons, and it keeps this page's
// bundle small.
export function BarChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number }[];
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-xs text-slate-600">
            {d.label}
          </span>
          <div className="h-4 flex-1 rounded bg-slate-100">
            <div
              className="h-4 rounded bg-slate-700"
              style={{ width: `${max > 0 ? Math.min((d.value / max) * 100, 100) : 0}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs font-medium text-slate-900">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
