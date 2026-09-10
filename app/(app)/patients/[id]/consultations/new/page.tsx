import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { NewConsultationForm } from "@/components/patients/new-consultation-form";

export default async function NewConsultationPage({
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

  // The Server Action enforces this too - this check exists so an
  // unauthorized user never even sees the form, not as the actual
  // security boundary.
  if (!user || !(await can(user, "consultation:create"))) {
    redirect(`/patients/${patient.id}`);
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Consultation
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {patient.lastName}, {patient.firstName} ({formatMrn(patient.mrnNumber)})
      </p>
      <NewConsultationForm patientId={patient.id} />
    </div>
  );
}
