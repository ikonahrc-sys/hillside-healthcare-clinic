import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { listPlacements } from "@/lib/services/placement-service";

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-slate-200 text-slate-700",
  SUSPENDED: "bg-red-100 text-red-800",
  EXTENDED: "bg-amber-100 text-amber-800",
};

export default async function PlacementsPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "placement:manage"))) {
    redirect("/dashboard");
  }

  const placements = await listPlacements(user);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Clinical Placements
        </h1>
        <Link
          href="/placements/new"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          New Placement
        </Link>
      </div>

      {placements.length === 0 ? (
        <p className="text-sm text-slate-500">No placements yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {placements.map((p) => (
            <li
              key={p.id}
              className="rounded border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.student.fullName}{" "}
                    <span className="font-normal text-slate-400">
                      ({p.student.email})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.department.name}
                    {p.clinicalArea ? ` - ${p.clinicalArea}` : ""}
                    {p.supervisor ? ` - supervised by ${p.supervisor.fullName}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {p.startDate.toDateString()} - {p.endDate.toDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
