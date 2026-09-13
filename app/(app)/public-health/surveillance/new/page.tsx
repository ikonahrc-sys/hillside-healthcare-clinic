import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { listPatients } from "@/lib/services/patient-service";
import { NewSurveillanceCaseForm } from "@/components/public-health/new-surveillance-case-form";

export default async function NewSurveillanceCasePage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "publichealth:manage"))) {
    redirect("/public-health");
  }

  const patients = await listPatients(user);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Surveillance Case
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Log a notifiable disease case or cluster for tracking.
      </p>
      <NewSurveillanceCaseForm patients={patients} />
    </div>
  );
}
