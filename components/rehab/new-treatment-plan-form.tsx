"use client";

import { useActionState } from "react";
import {
  createTreatmentPlanAction,
  type RehabActionState,
} from "@/lib/actions/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function NewTreatmentPlanForm({ assessmentId }: { assessmentId: string }) {
  const actionWithAssessmentId = createTreatmentPlanAction.bind(null, assessmentId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithAssessmentId, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="goals" className={labelClass}>
          Goals
        </label>
        <textarea id="goals" name="goals" rows={3} required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" className={labelClass}>
          Frequency
        </label>
        <input
          id="frequency"
          name="frequency"
          placeholder="e.g. 3 sessions per week for 6 weeks"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reviewDate" className={labelClass}>
          Review date
        </label>
        <input id="reviewDate" name="reviewDate" type="date" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="precautions" className={labelClass}>
          Precautions
        </label>
        <textarea id="precautions" name="precautions" rows={2} className={inputClass} />
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
        {isPending ? "Saving..." : "Save treatment plan"}
      </button>
    </form>
  );
}
