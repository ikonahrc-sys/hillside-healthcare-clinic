export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tone === "warning" ? "text-amber-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
