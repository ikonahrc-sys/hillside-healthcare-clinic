import Link from "next/link";
import type { listConsultationsForPatient } from "@/lib/services/consultation-service";

type Consultation = Awaited<ReturnType<typeof listConsultationsForPatient>>[number];

export function ConsultationsTab({
  patientId,
  consultations,
  canManageAppointments,
  canCreateConsultation,
}: {
  patientId: string;
  consultations: Consultation[];
  canManageAppointments: boolean;
  canCreateConsultation: boolean;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-end gap-2">
        {canManageAppointments && (
          <Link
            href={`/patients/${patientId}/follow-up/new`}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            Schedule Follow-up
          </Link>
        )}
        {canCreateConsultation && (
          <Link
            href={`/patients/${patientId}/consultations/new`}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Consultation
          </Link>
        )}
      </div>

      {consultations.length === 0 ? (
        <p className="text-sm text-slate-500">No consultations recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {consultations.map((c) => (
            <li
              key={c.id}
              className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {c.chiefComplaint}
                </p>
                <p className="text-xs text-slate-400">
                  {c.consultationDate.toDateString()} - {c.doctor.fullName}
                </p>
              </div>
              {c.diagnoses.length > 0 && (
                <p className="mt-1 text-sm text-slate-600">
                  Diagnosis: {c.diagnoses.map((d) => d.description).join(", ")}
                </p>
              )}
              {c.vitals && (
                <p className="mt-1 text-xs text-slate-500">
                  {c.vitals.temperatureC != null &&
                    `Temp ${c.vitals.temperatureC}°C `}
                  {c.vitals.heartRateBpm != null &&
                    `HR ${c.vitals.heartRateBpm}bpm `}
                  {c.vitals.bloodPressureSystolic != null &&
                    c.vitals.bloodPressureDiastolic != null &&
                    `BP ${c.vitals.bloodPressureSystolic}/${c.vitals.bloodPressureDiastolic} `}
                  {c.vitals.oxygenSaturationPercent != null &&
                    `O2 ${c.vitals.oxygenSaturationPercent}% `}
                </p>
              )}
              {c.assessment && (
                <p className="mt-1 text-sm text-slate-600">{c.assessment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
