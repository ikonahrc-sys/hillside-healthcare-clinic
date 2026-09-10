import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listPrescriptionQueue } from "@/lib/services/prescription-service";
import { formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
};

export default async function PrescriptionQueuePage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "prescription:dispense"))) {
    redirect("/dashboard");
  }

  const prescriptions = await listPrescriptionQueue(user);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Prescription Queue
        </h1>
        <div className="flex gap-2">
          <Link
            href="/pharmacy"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            Dashboard
          </Link>
          <Link
            href="/pharmacy/inventory"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            Inventory
          </Link>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing pending.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {prescriptions.map((p) => (
            <li key={p.id} className="rounded border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/pharmacy/prescriptions/${p.id}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    {p.patient.lastName}, {p.patient.firstName} (
                    {formatMrn(p.patient.mrnNumber)})
                  </Link>
                  <p className="text-xs text-slate-500">
                    {p.items
                      .map((i) => `${i.medicine.name} ${i.medicine.strength ?? ""}`)
                      .join(", ")}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ?? "bg-slate-100 text-slate-700"}`}
                >
                  {p.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
