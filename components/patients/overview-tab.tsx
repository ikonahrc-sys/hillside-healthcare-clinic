import type { getPatientById } from "@/lib/services/patient-service";

type Patient = NonNullable<Awaited<ReturnType<typeof getPatientById>>>;

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="text-sm text-slate-900">{value || "-"}</dd>
    </div>
  );
}

export function OverviewTab({ patient }: { patient: Patient }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <dl className="grid grid-cols-2 gap-4">
        <Field label="Date of birth" value={patient.dateOfBirth.toDateString()} />
        <Field label="Phone" value={patient.phone} />
        <Field label="Address" value={patient.address} />
        <Field label="Email" value={patient.email} />
        <Field
          label="Emergency contact"
          value={
            patient.emergencyContactName
              ? `${patient.emergencyContactName} (${patient.emergencyContactPhone ?? "no phone"})`
              : null
          }
        />
        <Field label="Allergies" value={patient.allergies} />
      </dl>
      {patient.medicalHistoryNotes && (
        <div className="mt-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Medical history notes
          </dt>
          <dd className="text-sm text-slate-900">{patient.medicalHistoryNotes}</dd>
        </div>
      )}
    </div>
  );
}
