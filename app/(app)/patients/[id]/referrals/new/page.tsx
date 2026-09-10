import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db";
import { NewReferralForm } from "@/components/patients/new-referral-form";

export default async function NewReferralPage({
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

  if (!user || !(await can(user, "referral:manage"))) {
    redirect(`/patients/${patient.id}`);
  }

  const departments = await prisma.department.findMany({
    where: { id: { not: user.departmentId ?? undefined } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Referral
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {patient.lastName}, {patient.firstName} ({formatMrn(patient.mrnNumber)})
      </p>
      <NewReferralForm patientId={patient.id} departments={departments} />
    </div>
  );
}
