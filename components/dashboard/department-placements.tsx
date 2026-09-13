type Placement = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  student: { fullName: string; email: string };
  supervisor: { fullName: string } | null;
};

export function DepartmentPlacements({ placements }: { placements: Placement[] }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        Students in your department{" "}
        <span className="font-normal text-slate-400">({placements.length})</span>
      </h2>
      {placements.length === 0 ? (
        <p className="text-sm text-slate-400">No students currently placed.</p>
      ) : (
        <ul>
          {placements.map((p) => (
            <li
              key={p.id}
              className="flex items-baseline justify-between border-t border-slate-100 py-2 first:border-t-0"
            >
              <div>
                <span className="text-sm font-medium text-slate-900">
                  {p.student.fullName}
                </span>
                <span className="ml-2 text-xs text-slate-400">{p.student.email}</span>
                {p.supervisor && (
                  <p className="text-xs text-slate-500">
                    Supervised by {p.supervisor.fullName}
                  </p>
                )}
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-slate-600">
                {p.startDate.toDateString()} - {p.endDate.toDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
