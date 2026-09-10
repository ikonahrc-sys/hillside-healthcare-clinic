import Link from "next/link";
import type { listHomeNursingAssessmentsForPatient } from "@/lib/services/home-nursing-service";

type Assessment = Awaited<ReturnType<typeof listHomeNursingAssessmentsForPatient>>[number];

export function HomeNursingTab({
  patientId,
  assessments,
  canManage,
  canScheduleAppointments,
}: {
  patientId: string;
  assessments: Assessment[];
  canManage: boolean;
  canScheduleAppointments: boolean;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-end gap-2">
        {canScheduleAppointments && (
          <Link
            href={`/patients/${patientId}/home-nursing-appointments/new`}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            Schedule Visit
          </Link>
        )}
        {canManage && (
          <Link
            href={`/patients/${patientId}/home-nursing-assessments/new`}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Assessment
          </Link>
        )}
      </div>

      {assessments.length === 0 ? (
        <p className="text-sm text-slate-500">No home nursing assessments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assessments.map((a) => (
            <li
              key={a.id}
              className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline justify-between">
                <Link
                  href={`/home-nursing-assessments/${a.id}`}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  Home Nursing Assessment
                </Link>
                <span className="text-xs text-slate-400">
                  {a.createdAt.toDateString()} - {a.nurse.fullName}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{a.findings}</p>
              {a.carePlan ? (
                <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Care plan active
                </span>
              ) : (
                <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  No care plan yet
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
