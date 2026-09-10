"use client";

import { useActionState } from "react";
import {
  logHomeVisitAction,
  type HomeNursingActionState,
} from "@/lib/actions/home-nursing";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function LogHomeVisitForm({
  assessmentId,
  carePlanId,
}: {
  assessmentId: string;
  carePlanId: string;
}) {
  const actionWithIds = logHomeVisitAction.bind(null, assessmentId, carePlanId);
  const [state, formAction, isPending] = useActionState<
    HomeNursingActionState,
    FormData
  >(actionWithIds, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="careProvided" className={labelClass}>
          Care provided
        </label>
        <textarea
          id="careProvided"
          name="careProvided"
          rows={3}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="patientCondition" className={labelClass}>
          Patient condition
        </label>
        <textarea id="patientCondition" name="patientCondition" rows={2} className={inputClass} />
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
        {isPending ? "Saving..." : "Log visit"}
      </button>
    </form>
  );
}
