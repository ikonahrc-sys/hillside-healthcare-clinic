"use client";

import { useActionState } from "react";
import {
  scheduleFollowUpAction,
  type ScheduleFollowUpState,
} from "@/lib/actions/appointment";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function ScheduleFollowUpForm({ patientId }: { patientId: string }) {
  const actionWithPatientId = scheduleFollowUpAction.bind(null, patientId);
  const [state, formAction, isPending] = useActionState<
    ScheduleFollowUpState,
    FormData
  >(actionWithPatientId, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="scheduledAt" className={labelClass}>
          Date and time <span className="font-normal text-slate-400">(facility time)</span>
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          className={inputClass}
        />
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
        {isPending ? "Scheduling..." : "Schedule follow-up"}
      </button>
    </form>
  );
}
