"use client";

import { useActionState } from "react";
import {
  receiveStockAction,
  type ReceiveStockState,
} from "@/lib/actions/inventory";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Medicine = {
  id: string;
  name: string;
  strength: string | null;
  dosageForm: string;
};

export function ReceiveStockForm({ medicines }: { medicines: Medicine[] }) {
  const [state, formAction, isPending] = useActionState<
    ReceiveStockState,
    FormData
  >(receiveStockAction, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="medicineId" className={labelClass}>
          Medicine
        </label>
        <select id="medicineId" name="medicineId" required className={inputClass}>
          <option value="">Select medicine...</option>
          {medicines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.strength ?? ""} ({m.dosageForm})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="batchNumber" className={labelClass}>
          Batch number
        </label>
        <input id="batchNumber" name="batchNumber" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantity" className={labelClass}>
          Quantity received
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="expiryDate" className={labelClass}>
          Expiry date
        </label>
        <input
          id="expiryDate"
          name="expiryDate"
          type="date"
          required
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Receive stock"}
      </button>
    </form>
  );
}
