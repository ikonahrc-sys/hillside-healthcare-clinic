"use client";

import { dispenseItemAction } from "@/lib/actions/prescription";

type Batch = {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantityOnHand: number;
};

export function DispenseItemForm({
  itemId,
  prescriptionId,
  batches,
}: {
  itemId: string;
  prescriptionId: string;
  batches: Batch[];
}) {
  if (batches.length === 0) {
    return (
      <p className="text-sm text-red-600">
        Insufficient stock - no batch has enough quantity to dispense this item.
      </p>
    );
  }

  return (
    <form action={dispenseItemAction} className="flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="prescriptionId" value={prescriptionId} />
      <select
        name="batchId"
        required
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      >
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.batchNumber} - exp {new Date(b.expiryDate).toLocaleDateString()} - qty{" "}
            {b.quantityOnHand}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white"
      >
        Dispense
      </button>
    </form>
  );
}
