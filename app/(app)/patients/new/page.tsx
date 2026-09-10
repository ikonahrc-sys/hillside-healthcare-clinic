import { NewPatientForm } from "@/components/patients/new-patient-form";

export default function NewPatientPage() {
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Register New Patient
      </h1>
      <NewPatientForm />
    </div>
  );
}
