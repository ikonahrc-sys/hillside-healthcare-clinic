import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { NewAssessmentForm } from "@/components/home-nursing/new-assessment-form";

export default async function NewHomeNursingAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ referralId?: string }>;
}) {
  const { id } = await params;
  const { referralId } = await searchParams;
  const user = await getCurrentUser();
  const patient = await getPatientById(user, id);

  if (!patient) {
    notFound();
  }

  if (!user || !(await can(user, "homenursing:manage"))) {
    redirect(`/patients/${patient.id}`);
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Home Nursing Assessment
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {patient.lastName}, {patient.firstName} ({formatMrn(patient.mrnNumber)})
      </p>
      <NewAssessmentForm patientId={patient.id} referralId={referralId} />
    </div>
  );
}
