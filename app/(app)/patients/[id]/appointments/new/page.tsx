import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { getAvailableAppointmentTypes } from "@/lib/services/appointment-service";
import { ScheduleAppointmentForm } from "@/components/appointments/schedule-appointment-form";

export default async function NewAppointmentPage({
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

  const availableTypes = await getAvailableAppointmentTypes(user).catch(() => []);
  if (availableTypes.length === 0) {
    redirect(`/patients/${patient.id}`);
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        Book Appointment
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {patient.lastName}, {patient.firstName} ({formatMrn(patient.mrnNumber)})
      </p>
      <ScheduleAppointmentForm patientId={patient.id} availableTypes={availableTypes} />
    </div>
  );
}
