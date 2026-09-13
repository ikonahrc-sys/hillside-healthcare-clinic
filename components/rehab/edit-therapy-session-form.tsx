"use client";

import { useActionState } from "react";
import {
  updateTherapySessionAction,
  type RehabActionState,
} from "@/lib/actions/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function EditTherapySessionForm({
  assessmentId,
  sessionId,
  initial,
}: {
  assessmentId: string;
  sessionId: string;
  initial: {
    activities: string;
    setting: string;
    progress: string | null;
    notes: string | null;
  };
}) {
  const actionWithIds = updateTherapySessionAction.bind(null, assessmentId, sessionId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithIds, null);

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-3 rounded border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Edit your submission
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="activities" className={labelClass}>Activities</label>
        <textarea id="activities" name="activities" rows={3} required defaultValue={initial.activities} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="setting" className={labelClass}>Where did this happen?</label>
        <select id="setting" name="setting" defaultValue={initial.setting} className={inputClass}>
          <option value="CLINIC">Clinic</option>
          <option value="HOME_HEALTH_VISIT">Home Health Visit</option>
          <option value="MOBILE_CLINIC">Mobile Clinic</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="progress" className={labelClass}>Progress</label>
        <textarea id="progress" name="progress" rows={2} defaultValue={initial.progress ?? ""} className={inputClass} />
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
