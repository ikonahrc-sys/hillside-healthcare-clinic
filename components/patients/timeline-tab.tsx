import type { TimelineEntry } from "@/lib/utils/timeline";

const TYPE_STYLES: Record<TimelineEntry["type"], string> = {
  consultation: "bg-indigo-100 text-indigo-800",
  prescription: "bg-emerald-100 text-emerald-800",
  referral: "bg-amber-100 text-amber-800",
  appointment: "bg-sky-100 text-sky-800",
  rehab: "bg-purple-100 text-purple-800",
};

export function TimelineTab({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No activity recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li
              key={`${entry.type}-${entry.id}`}
              className="flex items-start justify-between border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_STYLES[entry.type]}`}
                  >
                    {entry.type}
                  </span>
                  {entry.isUpcoming && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                      Upcoming
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {entry.title}
                </p>
                <p className="text-xs text-slate-500">{entry.subtitle}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">
                {entry.date.toLocaleString("en-US", {
                  timeZone: "America/Belize",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
