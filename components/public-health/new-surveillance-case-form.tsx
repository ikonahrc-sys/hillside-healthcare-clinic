"use client";

import { useActionState } from "react";
import {
  createSurveillanceCaseAction,
  type SurveillanceCaseState,
} from "@/lib/actions/public-health";
import { formatMrn } from "@/lib/utils/mrn";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Patient = { id: string; firstName: string; lastName: string; mrnNumber: number };

export function NewSurveillanceCaseForm({ patients }: { patients: Patient[] }) {
  const [state, formAction, isPending] = useActionState<
    SurveillanceCaseState,
    FormData
  >(createSurveillanceCaseAction, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="diseaseName" className={labelClass}>
          Disease / condition
        </label>
        <input id="diseaseName" name="diseaseName" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reportDate" className={labelClass}>
          Report date
        </label>
        <input id="reportDate" name="reportDate" type="date" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className={labelClass}>
          Location
        </label>
        <input id="location" name="location" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select id="status" name="status" defaultValue="INVESTIGATING" className={inputClass}>
          <option value="INVESTIGATING">Investigating</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="patientId" className={labelClass}>
          Linked patient <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <select id="patientId" name="patientId" className={inputClass}>
          <option value="">Not linked to an existing patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.lastName}, {p.firstName} ({formatMrn(p.mrnNumber)})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="font-normal text-slate-400">(optional)</span>
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
        {isPending ? "Saving..." : "Log surveillance case"}
      </button>
    </form>
  );
}
