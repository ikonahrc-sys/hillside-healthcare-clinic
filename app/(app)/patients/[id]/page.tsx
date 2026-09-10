import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { listConsultationsForPatient } from "@/lib/services/consultation-service";
import { listReferralsForPatient } from "@/lib/services/referral-service";
import { listPrescriptionsForPatient } from "@/lib/services/prescription-service";
import { can } from "@/lib/auth/authorize";
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

  const [
    consultations,
    referrals,
    prescriptions,
    canCreateConsultation,
    canManageReferrals,
    canCreatePrescription,
    canManageAppointments,
  ] = await Promise.all([
    listConsultationsForPatient(user, patient.id),
    listReferralsForPatient(user, patient.id),
    listPrescriptionsForPatient(user, patient.id),
    user ? can(user, "consultation:create") : Promise.resolve(false),
    user ? can(user, "referral:manage") : Promise.resolve(false),
    user ? can(user, "prescription:create") : Promise.resolve(false),
    user ? can(user, "appointment:manage") : Promise.resolve(false),
  ]);

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

      <div className="mt-6 rounded border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Consultations
          </h2>
          <div className="flex gap-2">
            {canManageAppointments && (
              <Link
                href={`/patients/${patient.id}/follow-up/new`}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                Schedule Follow-up
              </Link>
            )}
            {canCreateConsultation && (
              <Link
                href={`/patients/${patient.id}/consultations/new`}
                className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
              >
                New Consultation
              </Link>
            )}
          </div>
        </div>

        {consultations.length === 0 ? (
          <p className="text-sm text-slate-500">No consultations recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {consultations.map((c) => (
              <li key={c.id} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
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
                    Diagnosis:{" "}
                    {c.diagnoses.map((d) => d.description).join(", ")}
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

      <div className="mt-6 rounded border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Prescriptions
          </h2>
          {canCreatePrescription && (
            <Link
              href={`/patients/${patient.id}/prescriptions/new`}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              New Prescription
            </Link>
          )}
        </div>

        {prescriptions.length === 0 ? (
          <p className="text-sm text-slate-500">No prescriptions yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {prescriptions.map((p) => (
              <li
                key={p.id}
                className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-slate-900">
                    {p.items
                      .map(
                        (item) =>
                          `${item.medicine.name} ${item.medicine.strength ?? ""}`,
                      )
                      .join(", ")}
                  </p>
                  <span className="text-xs font-medium text-slate-500">
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  by {p.prescribedByUser.fullName} - {p.createdAt.toDateString()}
                </p>
                <ul className="mt-1 text-sm text-slate-600">
                  {p.items.map((item) => (
                    <li key={item.id}>
                      {item.medicine.name} {item.medicine.strength} (
                      {item.medicine.dosageForm}) - {item.dosageInstructions} -
                      qty {item.quantity}
                    </li>
                  ))}
                </ul>
                {p.notes && (
                  <p className="mt-1 text-sm text-slate-600">{p.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Referrals</h2>
          {canManageReferrals && (
            <Link
              href={`/patients/${patient.id}/referrals/new`}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              New Referral
            </Link>
          )}
        </div>

        {referrals.length === 0 ? (
          <p className="text-sm text-slate-500">No referrals yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {referrals.map((r) => (
              <li
                key={r.id}
                className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-slate-900">
                    {r.fromDepartment.name} → {r.toDepartment.name}
                  </p>
                  <span className="text-xs font-medium text-slate-500">
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  by {r.referringUser.fullName} - {r.createdAt.toDateString()}
                </p>
                <p className="mt-1 text-sm text-slate-600">{r.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
