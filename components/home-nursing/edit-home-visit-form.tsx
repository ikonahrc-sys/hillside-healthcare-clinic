"use client";

import { useActionState } from "react";
import {
  updateHomeVisitAction,
  type HomeNursingActionState,
} from "@/lib/actions/home-nursing";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function EditHomeVisitForm({
  assessmentId,
  visitId,
  initial,
}: {
  assessmentId: string;
  visitId: string;
  initial: {
    careProvided: string;
    patientCondition: string | null;
    notes: string | null;
  };
}) {
  const actionWithIds = updateHomeVisitAction.bind(null, assessmentId, visitId);
  const [state, formAction, isPending] = useActionState<
    HomeNursingActionState,
    FormData
  >(actionWithIds, null);

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-3 rounded border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Edit your submission
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="careProvided" className={labelClass}>Care provided</label>
        <textarea id="careProvided" name="careProvided" rows={3} required defaultValue={initial.careProvided} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="patientCondition" className={labelClass}>Patient condition</label>
        <textarea id="patientCondition" name="patientCondition" rows={2} defaultValue={initial.patientCondition ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={initial.notes ?? ""} className={inputClass} />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save corrections"}
      </button>
    </form>
  );
}
