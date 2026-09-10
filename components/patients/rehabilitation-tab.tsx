import Link from "next/link";
import type { listRehabAssessmentsForPatient } from "@/lib/services/rehab-service";

type Assessment = Awaited<ReturnType<typeof listRehabAssessmentsForPatient>>[number];

const DISCIPLINE_LABELS: Record<string, string> = {
  PHYSIOTHERAPY: "Physiotherapy",
  SPEECH_THERAPY: "Speech Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
};

export function RehabilitationTab({
  patientId,
  assessments,
  canManage,
}: {
  patientId: string;
  assessments: Assessment[];
  canManage: boolean;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-end">
        {canManage && (
          <Link
            href={`/patients/${patientId}/rehab-assessments/new`}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Assessment
          </Link>
        )}
      </div>

      {assessments.length === 0 ? (
        <p className="text-sm text-slate-500">No rehabilitation assessments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assessments.map((a) => (
            <li
              key={a.id}
              className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline justify-between">
                <Link
                  href={`/rehab-assessments/${a.id}`}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  {DISCIPLINE_LABELS[a.discipline]}
                </Link>
                <span className="text-xs text-slate-400">
                  {a.createdAt.toDateString()} - {a.therapist.fullName}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{a.findings}</p>
              {a.treatmentPlan ? (
                <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Treatment plan active
                </span>
              ) : (
                <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  No treatment plan yet
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
