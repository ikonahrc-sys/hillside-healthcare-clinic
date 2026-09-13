import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import {
  listOutreachVisits,
  listSurveillanceCases,
} from "@/lib/services/public-health-service";
import { formatMrn } from "@/lib/services/patient-service";

const STATUS_STYLES: Record<string, string> = {
  INVESTIGATING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-red-100 text-red-800",
  RESOLVED: "bg-green-100 text-green-800",
};

export default async function PublicHealthPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "publichealth:manage"))) {
    redirect("/dashboard");
  }

  const [outreachVisits, surveillanceCases] = await Promise.all([
    listOutreachVisits(user),
    listSurveillanceCases(user),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            Community Outreach Visits
          </h1>
          <Link
            href="/public-health/outreach/new"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Outreach Visit
          </Link>
        </div>

        {outreachVisits.length === 0 ? (
          <p className="text-sm text-slate-500">No outreach visits logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {outreachVisits.map((v) => (
              <li key={v.id} className="rounded border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-slate-900">{v.location}</p>
                  <span className="text-xs text-slate-500">
                    {v.visitDate.toDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{v.activity}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {v.peopleReached} people reached - logged by {v.staff.fullName}
                </p>
                {v.notes && <p className="mt-1 text-xs text-slate-500">{v.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            Disease Surveillance
          </h1>
          <Link
            href="/public-health/surveillance/new"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Surveillance Case
          </Link>
        </div>

        {surveillanceCases.length === 0 ? (
          <p className="text-sm text-slate-500">No surveillance cases logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {surveillanceCases.map((c) => (
              <li key={c.id} className="rounded border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-slate-900">{c.diseaseName}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {c.location} - {c.reportDate.toDateString()} - reported by{" "}
                  {c.reportedByUser.fullName}
                </p>
                {c.patient && (
                  <p className="mt-1 text-xs text-slate-500">
                    Linked patient: {c.patient.lastName}, {c.patient.firstName} (
                    {formatMrn(c.patient.mrnNumber)})
                  </p>
                )}
                {c.notes && <p className="mt-1 text-xs text-slate-500">{c.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
