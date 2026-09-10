"use client";

import { useActionState } from "react";
import {
  logTherapySessionAction,
  type RehabActionState,
} from "@/lib/actions/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function LogTherapySessionForm({
  assessmentId,
  treatmentPlanId,
}: {
  assessmentId: string;
  treatmentPlanId: string;
}) {
  const actionWithIds = logTherapySessionAction.bind(null, assessmentId, treatmentPlanId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithIds, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="activities" className={labelClass}>
          Activities
        </label>
        <textarea
          id="activities"
          name="activities"
          rows={3}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="progress" className={labelClass}>
          Progress
        </label>
        <textarea id="progress" name="progress" rows={2} className={inputClass} />
      </div>

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
        {isPending ? "Saving..." : "Log session"}
      </button>
    </form>
  );
}
