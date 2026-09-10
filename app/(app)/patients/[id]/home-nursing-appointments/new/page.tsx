import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { ScheduleHomeVisitForm } from "@/components/home-nursing/schedule-home-visit-form";

export default async function ScheduleHomeVisitPage({
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

  if (!user || !(await can(user, "appointment:manage"))) {
    redirect(`/patients/${patient.id}?tab=home-nursing`);
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        Schedule Home Visit
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {patient.lastName}, {patient.firstName} ({formatMrn(patient.mrnNumber)})
      </p>
      <ScheduleHomeVisitForm patientId={patient.id} />
    </div>
  );
}
