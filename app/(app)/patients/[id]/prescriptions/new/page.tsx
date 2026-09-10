import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { listMedicines } from "@/lib/services/prescription-service";
import { can } from "@/lib/auth/authorize";
import { NewPrescriptionForm } from "@/components/patients/new-prescription-form";

export default async function NewPrescriptionPage({
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

  if (!user || !(await can(user, "prescription:create"))) {
    redirect(`/patients/${patient.id}`);
  }

  const medicines = await listMedicines(user);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Prescription
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {patient.lastName}, {patient.firstName} ({formatMrn(patient.mrnNumber)})
      </p>
      <NewPrescriptionForm patientId={patient.id} medicines={medicines} />
    </div>
  );
}
