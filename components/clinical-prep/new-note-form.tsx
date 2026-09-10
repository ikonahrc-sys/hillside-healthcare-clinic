"use client";

import { useActionState } from "react";
import {
  createPreparationNoteAction,
  type ClinicalPrepActionState,
} from "@/lib/actions/clinical-prep";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Patient = { id: string; firstName: string; lastName: string; mrnNumber: number };

export function NewNoteForm({ patients }: { patients: Patient[] }) {
  const [state, formAction, isPending] = useActionState<
    ClinicalPrepActionState,
    FormData
  >(createPreparationNoteAction, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="patientId" className={labelClass}>
          Patient
        </label>
        <select id="patientId" name="patientId" required className={inputClass}>
          <option value="">Select patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.lastName}, {p.firstName} (P{p.mrnNumber.toString().padStart(5, "0")})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="content" className={labelClass}>
          Note
        </label>
        <textarea id="content" name="content" rows={6} required className={inputClass} />
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
        {isPending ? "Saving..." : "Save note"}
      </button>
    </form>
  );
}
