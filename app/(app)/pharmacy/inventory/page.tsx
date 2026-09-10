import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listMedicinesWithStock } from "@/lib/services/inventory-service";
import { can } from "@/lib/auth/authorize";

export default async function InventoryPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "inventory:manage"))) {
    redirect("/dashboard");
  }

  const medicines = await listMedicinesWithStock(user);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Inventory</h1>
        <div className="flex gap-2">
          <Link
            href="/pharmacy/prescriptions"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            Prescription Queue
          </Link>
          <Link
            href="/pharmacy/inventory/receive"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Receive Stock
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {medicines.map((m) => (
          <div key={m.id} className="rounded border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">
                {m.name} {m.strength} ({m.dosageForm})
              </p>
              <div className="flex items-center gap-2">
                {m.isLowStock && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    Low stock
                  </span>
                )}
                <span className="text-sm text-slate-600">
                  {m.totalQuantity} on hand
                  {m.reorderLevel != null && ` (reorder at ${m.reorderLevel})`}
                </span>
              </div>
            </div>

            {m.batches.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No batches received yet.</p>
            ) : (
              <table className="mt-3 w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="pb-1 pr-4 font-medium">Batch</th>
                    <th className="pb-1 pr-4 font-medium">Expiry</th>
                    <th className="pb-1 pr-4 font-medium">Qty</th>
                    <th className="pb-1 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {m.batches.map((b) => (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="py-1 pr-4 text-slate-700">{b.batchNumber}</td>
                      <td className="py-1 pr-4 text-slate-700">
                        {b.expiryDate.toDateString()}
                      </td>
                      <td className="py-1 pr-4 text-slate-700">{b.quantityOnHand}</td>
                      <td className="py-1">
                        {b.isExpired ? (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800">
                            Expired
                          </span>
                        ) : b.isExpiringSoon ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                            Expiring soon
                          </span>
                        ) : (
                          <span className="text-slate-400">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
