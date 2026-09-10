"use client";

import { useActionState, useState } from "react";
import {
  createPrescriptionAction,
  type CreatePrescriptionState,
} from "@/lib/actions/prescription";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Medicine = {
  id: string;
  name: string;
  strength: string | null;
  dosageForm: string;
};

type ItemRow = {
  medicineId: string;
  dosageInstructions: string;
  quantity: string;
};

const EMPTY_ROW: ItemRow = { medicineId: "", dosageInstructions: "", quantity: "" };

export function NewPrescriptionForm({
  patientId,
  medicines,
}: {
  patientId: string;
  medicines: Medicine[];
}) {
  const actionWithPatientId = createPrescriptionAction.bind(null, patientId);
  const [state, formAction, isPending] = useActionState<
    CreatePrescriptionState,
    FormData
  >(actionWithPatientId, null);

  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ROW }]);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addItem() {
    setItems((rows) => [...rows, { ...EMPTY_ROW }]);
  }

  function removeItem(index: number) {
    setItems((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4">
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      <fieldset className="rounded border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">
          Medicines
        </legend>

        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[2fr_2fr_1fr_auto] gap-2">
              <select
                aria-label="Medicine"
                value={item.medicineId}
                onChange={(e) => updateItem(index, { medicineId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select medicine...</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.strength ?? ""} ({m.dosageForm})
                  </option>
                ))}
              </select>
              <input
                aria-label="Dosage instructions"
                placeholder="e.g. 1 tablet three times daily for 5 days"
                value={item.dosageInstructions}
                onChange={(e) =>
                  updateItem(index, { dosageInstructions: e.target.value })
                }
                className={inputClass}
              />
              <input
                aria-label="Quantity"
                type="number"
                min={1}
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="rounded border border-slate-300 px-2 text-xs text-slate-600 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
        >
          + Add medicine
        </button>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
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
        {isPending ? "Saving..." : "Save prescription"}
      </button>
    </form>
  );
}
