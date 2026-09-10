import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listPatients, formatMrn } from "@/lib/services/patient-service";
import { calculateAge } from "@/lib/utils/age";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const patients = await listPatients(user, q);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Patients</h1>
        <Link
          href="/patients/new"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          New Patient
        </Link>
      </div>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or MRN..."
          className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </form>

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
