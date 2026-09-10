import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { listPendingCoSigns } from "@/lib/services/report-service";
import { formatMrn } from "@/lib/services/patient-service";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "placement:manage"))) {
    redirect("/dashboard");
  }

  const pendingCoSigns = await listPendingCoSigns(user);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        Pending Co-Signs
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Student-authored records across every department still awaiting a
        supervisor co-sign, oldest first.
      </p>

      {pendingCoSigns.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nothing pending - every student-authored record has been co-signed.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 font-medium">Department</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Patient</th>
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {pendingCoSigns.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-2 pr-4">{item.department}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={item.detailHref}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {item.label}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  {item.patientName} ({formatMrn(item.patientMrn)})
                </td>
                <td className="py-2 pr-4">{item.studentName}</td>
                <td className="py-2 pr-4">{item.date.toDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
