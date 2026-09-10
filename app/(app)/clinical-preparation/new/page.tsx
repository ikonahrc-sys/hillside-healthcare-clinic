import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { listPatientsForStudent } from "@/lib/services/patient-service";
import { NewNoteForm } from "@/components/clinical-prep/new-note-form";

export default async function NewClinicalPreparationNotePage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "clinical-prep:manage"))) {
    redirect("/dashboard");
  }

  const patients = await listPatientsForStudent(user);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Preparation Note
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Private to you - not part of the patient&apos;s official record.
      </p>
      {patients.length === 0 ? (
        <p className="text-sm text-slate-500">
          No patients relevant to your current placement yet.
        </p>
      ) : (
        <NewNoteForm patients={patients} />
      )}
    </div>
  );
}
