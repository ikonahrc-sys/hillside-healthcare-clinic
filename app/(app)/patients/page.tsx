import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listPatients,
  listPatientsForStudent,
  getActiveStudentPlacement,
  formatMrn,
} from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { calculateAge } from "@/lib/utils/age";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const isStudent = user?.role.name === "STUDENT";

  const [patients, canCreatePatient, studentDepartment] = await Promise.all([
    isStudent && user ? listPatientsForStudent(user) : listPatients(user, q),
    user ? can(user, "patient:write") : Promise.resolve(false),
    isStudent && user ? getActiveStudentPlacement(user) : Promise.resolve(undefined),
  ]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Patients</h1>
        {canCreatePatient && (
          <Link
            href="/patients/new"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Patient
          </Link>
        )}
      </div>

      {isStudent && (
        <p className="mb-4 text-sm text-slate-500">
          {studentDepartment
            ? `Showing patients relevant to your ${studentDepartment.name} placement.`
            : "You have no active clinical placement - no patients to show."}
        </p>
      )}

      {!isStudent && (
        <form className="mb-4">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or MRN..."
            className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </form>
      )}

      {patients.length === 0 ? (
        <p className="text-sm text-slate-500">
          {q ? "No patients match your search." : "No patients registered yet."}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 font-medium">MRN</th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Age</th>
              <th className="py-2 pr-4 font-medium">Sex</th>
              <th className="py-2 pr-4 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b border-slate-100">
                <td className="py-2 pr-4">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {formatMrn(patient.mrnNumber)}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  {patient.lastName}, {patient.firstName}
                </td>
                <td className="py-2 pr-4">
                  {calculateAge(patient.dateOfBirth)}
                </td>
                <td className="py-2 pr-4">{patient.sex}</td>
                <td className="py-2 pr-4">{patient.phone ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
