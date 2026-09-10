import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPrescriptionForDispensing } from "@/lib/services/prescription-service";
import { formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { DispenseItemForm } from "@/components/pharmacy/dispense-item-form";

export default async function PrescriptionDispensePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();

  if (!user || !(await can(user, "prescription:dispense"))) {
    redirect("/dashboard");
  }

  const prescription = await getPrescriptionForDispensing(user, id);
  if (!prescription) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">
          {prescription.patient.lastName}, {prescription.patient.firstName} (
          {formatMrn(prescription.patient.mrnNumber)})
        </h1>
        <p className="text-sm text-slate-500">
          Prescribed by {prescription.prescribedByUser.fullName} -{" "}
          {prescription.createdAt.toDateString()} - {prescription.status}
        </p>
        {prescription.notes && (
          <p className="mt-1 text-sm text-slate-600">{prescription.notes}</p>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {prescription.items.map((item) => {
          const sufficientBatches = item.medicine.batches
            .filter((b) => b.quantityOnHand >= item.quantity)
            .map((b) => ({
              id: b.id,
              batchNumber: b.batchNumber,
              expiryDate: b.expiryDate.toISOString(),
              quantityOnHand: b.quantityOnHand,
            }));

          return (
            <li key={item.id} className="rounded border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.medicine.name} {item.medicine.strength} (
                    {item.medicine.dosageForm})
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.dosageInstructions} - qty {item.quantity}
                  </p>
                </div>

                {item.dispensedAt ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Dispensed
                  </span>
                ) : (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Pending
                  </span>
                )}
              </div>

              {item.dispensedAt ? (
                <p className="mt-2 text-xs text-slate-500">
                  From batch {item.dispensedFromBatch?.batchNumber} by{" "}
                  {item.dispensedByUser?.fullName} on{" "}
                  {item.dispensedAt.toDateString()}
                </p>
              ) : (
                <div className="mt-3">
                  <DispenseItemForm
                    itemId={item.id}
                    prescriptionId={prescription.id}
                    batches={sufficientBatches}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
