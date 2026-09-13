"use client";

import { useActionState } from "react";
import {
  updateRehabAssessmentAction,
  type RehabActionState,
} from "@/lib/actions/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function EditAssessmentForm({
  assessmentId,
  initial,
}: {
  assessmentId: string;
  initial: {
    discipline: string;
    findings: string;
    functionalLimitations: string | null;
    goals: string | null;
    precautions: string | null;
    notes: string | null;
  };
}) {
  const actionWithId = updateRehabAssessmentAction.bind(null, assessmentId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithId, null);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3 rounded border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Edit your submission
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="discipline" className={labelClass}>Discipline</label>
        <select id="discipline" name="discipline" required defaultValue={initial.discipline} className={inputClass}>
          <option value="PHYSIOTHERAPY">Physiotherapy</option>
          <option value="SPEECH_THERAPY">Speech Therapy</option>
          <option value="OCCUPATIONAL_THERAPY">Occupational Therapy</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="findings" className={labelClass}>Findings</label>
        <textarea id="findings" name="findings" rows={3} required defaultValue={initial.findings} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="functionalLimitations" className={labelClass}>Functional limitations</label>
        <textarea id="functionalLimitations" name="functionalLimitations" rows={2} defaultValue={initial.functionalLimitations ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="goals" className={labelClass}>Goals</label>
        <textarea id="goals" name="goals" rows={2} defaultValue={initial.goals ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="precautions" className={labelClass}>Precautions</label>
        <textarea id="precautions" name="precautions" rows={2} defaultValue={initial.precautions ?? ""} className={inputClass} />
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
