import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { calculateAge } from "@/lib/utils/age";

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

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const patient = await getPatientById(user, id);

  if (!patient) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">
          {patient.lastName}, {patient.firstName}
        </h1>
        <p className="text-sm text-slate-500">
          {formatMrn(patient.mrnNumber)} - {calculateAge(patient.dateOfBirth)}{" "}
          years old - {patient.sex}
        </p>
      </div>

      {/* Overview only for now. Medical / Pharmacy / Rehabilitation /
          Home Nursing / Appointments / Documents / Timeline tabs arrive as
          each of those areas gets built in later Phase 2+ steps. */}
      <div className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Overview</h2>
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
            <dd className="text-sm text-slate-900">
              {patient.medicalHistoryNotes}
            </dd>
          </div>
        )}
      </div>
    </div>
  );
}
