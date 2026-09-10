import Link from "next/link";
import type { listPrescriptionsForPatient } from "@/lib/services/prescription-service";

type Prescription = Awaited<ReturnType<typeof listPrescriptionsForPatient>>[number];

export function PrescriptionsTab({
  patientId,
  prescriptions,
  canCreatePrescription,
}: {
  patientId: string;
  prescriptions: Prescription[];
  canCreatePrescription: boolean;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-end">
        {canCreatePrescription && (
          <Link
            href={`/patients/${patientId}/prescriptions/new`}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Prescription
          </Link>
        )}
      </div>

      {prescriptions.length === 0 ? (
        <p className="text-sm text-slate-500">No prescriptions yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {prescriptions.map((p) => (
            <li
              key={p.id}
              className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-slate-900">
                  {p.items
                    .map((item) => `${item.medicine.name} ${item.medicine.strength ?? ""}`)
                    .join(", ")}
                </p>
                <span className="text-xs font-medium text-slate-500">{p.status}</span>
              </div>
              <p className="text-xs text-slate-500">
                by {p.prescribedByUser.fullName} - {p.createdAt.toDateString()}
              </p>
              <ul className="mt-1 text-sm text-slate-600">
                {p.items.map((item) => (
                  <li key={item.id}>
                    {item.medicine.name} {item.medicine.strength} (
                    {item.medicine.dosageForm}) - {item.dosageInstructions} - qty{" "}
                    {item.quantity}
                  </li>
                ))}
              </ul>
              {p.notes && <p className="mt-1 text-sm text-slate-600">{p.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
