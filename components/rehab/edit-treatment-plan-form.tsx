"use client";

import { useActionState } from "react";
import {
  updateTreatmentPlanAction,
  type RehabActionState,
} from "@/lib/actions/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function EditTreatmentPlanForm({
  assessmentId,
  treatmentPlanId,
  initial,
}: {
  assessmentId: string;
  treatmentPlanId: string;
  initial: {
    goals: string;
    frequency: string;
    reviewDate: string | null;
    precautions: string | null;
  };
}) {
  const actionWithIds = updateTreatmentPlanAction.bind(null, assessmentId, treatmentPlanId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithIds, null);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3 rounded border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Edit your submission
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="goals" className={labelClass}>Goals</label>
        <textarea id="goals" name="goals" rows={2} required defaultValue={initial.goals} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" className={labelClass}>Frequency</label>
        <input id="frequency" name="frequency" required defaultValue={initial.frequency} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reviewDate" className={labelClass}>Review date</label>
        <input id="reviewDate" name="reviewDate" type="date" defaultValue={initial.reviewDate ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="precautions" className={labelClass}>Precautions</label>
        <textarea id="precautions" name="precautions" rows={2} defaultValue={initial.precautions ?? ""} className={inputClass} />
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
