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
    setting: string;
    subjective: string;
    objective: string;
    assessment: string | null;
    plan: string | null;
    homeExerciseProgram: string | null;
    additionalNotes: string | null;
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
        <label htmlFor="setting" className={labelClass}>Where did this happen?</label>
        <select id="setting" name="setting" defaultValue={initial.setting} className={inputClass}>
          <option value="CLINIC">Clinic</option>
          <option value="HOME_HEALTH_VISIT">Home Health Visit</option>
          <option value="MOBILE_CLINIC">Mobile Clinic</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subjective" className={labelClass}>S - Subjective</label>
        <textarea id="subjective" name="subjective" rows={3} required defaultValue={initial.subjective} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="objective" className={labelClass}>O - Objective</label>
        <textarea id="objective" name="objective" rows={4} required defaultValue={initial.objective} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="assessment" className={labelClass}>A - Assessment</label>
        <textarea id="assessment" name="assessment" rows={3} defaultValue={initial.assessment ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="plan" className={labelClass}>P - Plan</label>
        <textarea id="plan" name="plan" rows={3} defaultValue={initial.plan ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="homeExerciseProgram" className={labelClass}>Home Exercise Program</label>
        <textarea id="homeExerciseProgram" name="homeExerciseProgram" rows={2} defaultValue={initial.homeExerciseProgram ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="additionalNotes" className={labelClass}>Additional notes</label>
        <textarea id="additionalNotes" name="additionalNotes" rows={2} defaultValue={initial.additionalNotes ?? ""} className={inputClass} />
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
