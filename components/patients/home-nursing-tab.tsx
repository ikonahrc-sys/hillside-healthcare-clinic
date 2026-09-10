import Link from "next/link";
import type { listHomeNursingAssessmentsForPatient } from "@/lib/services/home-nursing-service";

type Assessment = Awaited<ReturnType<typeof listHomeNursingAssessmentsForPatient>>[number];

export function HomeNursingTab({
  patientId,
  assessments,
  canCreateAssessment,
  canScheduleAppointments,
}: {
  patientId: string;
  assessments: Assessment[];
  canCreateAssessment: boolean;
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
        {canCreateAssessment && (
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
          {assessments.map((a) => {
            const planPendingCoSign =
              a.carePlan &&
              a.carePlan.nurse.role.name === "STUDENT" &&
              !a.carePlan.coSignedAt;
            return (
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
                <div className="mt-1 flex flex-wrap gap-2">
                  {a.nurse.role.name === "STUDENT" && !a.coSignedAt && (
                    <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Pending co-sign
                    </span>
                  )}
                  {a.carePlan ? (
                    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Care plan active
                    </span>
                  ) : (
                    <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      No care plan yet
                    </span>
                  )}
                  {planPendingCoSign && (
                    <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Plan pending co-sign
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
